import {
  useGetProduct, getGetProductQueryKey,
  useCreateProduct, useUpdateProduct,
  useListCategories, getListCategoriesQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Upload, Library } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/media-picker";
import { useAuth } from "@clerk/react";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers and hyphens only"),
  description: z.string().min(10, "Description is required"),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().optional().nullable(),
  categoryId: z.coerce.number().optional().nullable(),
  stockQuantity: z.coerce.number().min(0, "Stock cannot be negative"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

interface ImageEntry { url: string; isPrimary: boolean; displayOrder: number; }
interface VariantEntry { name: string; value: string; priceModifier: number; }

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined && id !== "new";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getToken } = useAuth();

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(
    Number(id),
    { query: { enabled: isEdit, queryKey: getGetProductQueryKey(Number(id)) } }
  );

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", slug: "", description: "", price: 0, compareAtPrice: null,
      categoryId: null, stockQuantity: 0, isActive: true, isFeatured: false,
    },
  });

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initRef = useRef(false);
  useEffect(() => {
    if (product && isEdit && !initRef.current) {
      form.reset({
        name: product.name, slug: product.slug, description: product.description,
        price: product.price, compareAtPrice: product.compareAtPrice,
        categoryId: product.categoryId, stockQuantity: product.stockQuantity,
        isActive: product.isActive, isFeatured: product.isFeatured,
      });
      setImages(
        (product.images ?? []).map((img: { url: string; isPrimary: boolean; displayOrder: number }) => ({
          url: img.url, isPrimary: img.isPrimary, displayOrder: img.displayOrder,
        }))
      );
      setVariants(
        (product.variants ?? []).map((v: { name: string; value: string; priceModifier: number }) => ({
          name: v.name, value: v.value, priceModifier: v.priceModifier,
        }))
      );
      initRef.current = true;
    }
  }, [product, isEdit, form]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    const payload = { ...data };
    if (isEdit) {
      updateProduct.mutate(
        { id: Number(id), data: payload },
        {
          onSuccess: async (created) => {
            await syncImagesAndVariants(created.id);
            queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(Number(id)) });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product updated" });
            setLocation("/admin/products");
          },
          onError: () => toast({ title: "Failed to save product", variant: "destructive" }),
        }
      );
    } else {
      createProduct.mutate(
        { data: payload },
        {
          onSuccess: async (created) => {
            await syncImagesAndVariants(created.id);
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product created" });
            setLocation("/admin/products");
          },
          onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
        }
      );
    }
  };

  async function syncImagesAndVariants(productId: number) {
    await fetch(`/api/products/${productId}/images/sync`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: images.map((img, i) => ({ url: img.url, isPrimary: i === 0, displayOrder: i })) }),
    });
    await fetch(`/api/products/${productId}/variants/sync`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variants }),
    });
  }

  async function handleFileUpload(file: File) {
    setUploadingImage(true);
    try {
      const token = await getToken();
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      // Try Replit Object Storage first
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        credentials: "include",
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (urlRes.ok) {
        const { uploadURL, objectPath } = await urlRes.json();
        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload file");
        const rawPath = objectPath.replace(/^\/objects\//, "");
        const publicUrl = `/api/storage/product-images/${rawPath}`;
        setImages((prev) => [...prev, { url: publicUrl, isPrimary: prev.length === 0, displayOrder: prev.length }]);
        return;
      }

      // Fallback: direct upload to local filesystem (VPS)
      const formData = new FormData();
      formData.append("file", file);
      const directRes = await fetch("/api/storage/uploads/direct", {
        method: "POST",
        headers: { ...authHeader },
        credentials: "include",
        body: formData,
      });
      if (!directRes.ok) throw new Error("Direct upload failed");
      const { url } = await directRes.json();
      setImages((prev) => [...prev, { url, isPrimary: prev.length === 0, displayOrder: prev.length }]);
    } catch {
      toast({ title: "Image upload failed", description: "Could not upload image. Try pasting a URL instead.", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  }

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, { url: newImageUrl.trim(), isPrimary: prev.length === 0, displayOrder: prev.length }]);
    setNewImageUrl("");
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const addVariant = () => setVariants((prev) => [...prev, { name: "Size", value: "", priceModifier: 0 }]);
  const removeVariant = (i: number) => setVariants((prev) => prev.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, field: keyof VariantEntry, value: string | number) => {
    setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  };

  if (isEdit && isLoadingProduct) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading product…</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {isEdit ? "Edit Product" : "Add Product"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Core Fields */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <h2 className="font-semibold text-base border-b pb-3">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Classic Gold Hoop" {...field}
                        onChange={(e) => { field.onChange(e); if (!isEdit) form.setValue("slug", slugify(e.target.value)); }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl><Input placeholder="classic-gold-hoop" {...field} className="font-mono text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹) *</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="compareAtPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare At (₹)</FormLabel>
                      <FormControl><Input type="number" value={field.value ?? ""} onChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(val) => field.onChange(val ? Number(val) : null)}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories?.map((cat) => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="stockQuantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-6">
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl><Textarea placeholder="Product description…" className="h-40 resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-3 border rounded-md p-4 bg-muted/20">
                  <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg">
                      <div><FormLabel className="text-base">Active</FormLabel><FormDescription>Show in store</FormDescription></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isFeatured" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg">
                      <div><FormLabel className="text-base">Featured</FormLabel><FormDescription>Show on homepage</FormDescription></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-base">Product Images</h2>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
            <div className="flex gap-3">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL…"
                className="flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
              />
              <Button type="button" variant="outline" onClick={addImage} disabled={!newImageUrl.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add URL
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                <Upload className="h-4 w-4 mr-1" />
                {uploadingImage ? "Uploading…" : "Upload File"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMediaPickerOpen(true)}
              >
                <Library className="h-4 w-4 mr-1" />
                From Library
              </Button>
            </div>
            <MediaPicker
              open={mediaPickerOpen}
              onClose={() => setMediaPickerOpen(false)}
              onSelect={(url) => {
                setImages((prev) => [...prev, { url, isPrimary: prev.length === 0, displayOrder: prev.length }]);
                setMediaPickerOpen(false);
              }}
            />
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                    <img src={img.url} alt="Product" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] bg-[#9B0F5F] text-white px-1.5 py-0.5 rounded">Primary</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">No images yet. Add an image URL above.</p>
            )}
          </div>

          {/* Variants */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-semibold text-base">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" /> Add Variant
              </Button>
            </div>
            {variants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">No variants. Click "Add Variant" for sizes, colours, etc.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_1fr_120px_40px] gap-3 text-xs font-medium text-muted-foreground px-1">
                  <span>Variant Name</span><span>Value</span><span>Price Modifier (₹)</span><span />
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_120px_40px] gap-3 items-center">
                    <Input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)} placeholder="e.g. Size" className="h-9" />
                    <Input value={v.value} onChange={(e) => updateVariant(i, "value", e.target.value)} placeholder="e.g. Small" className="h-9" />
                    <Input type="number" value={v.priceModifier} onChange={(e) => updateVariant(i, "priceModifier", Number(e.target.value))} className="h-9" />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => removeVariant(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="bg-[#9B0F5F] hover:bg-[#7d0c4c]" disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/products")}>Cancel</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
