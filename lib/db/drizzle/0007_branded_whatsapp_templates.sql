-- Branded WhatsApp message templates for customer communication
UPDATE store_settings SET
  customer_order_template = '✨ *SRISWA STUDIO* ✨

Hi {{customerName}} 💖

Thank you for your order!

🧾 Order: *{{orderNumber}}*
💰 Total: *₹{{total}}*

Your anti-tarnish jewellery is being
prepared with love and care 💍

We''ll message you as soon as it ships 📦

🌐 sriswastudio.com
— Team Sriswa Studio',
  status_update_template = '✨ *SRISWA STUDIO* ✨

Hi {{customerName}} 💖

Update on your order *{{orderNumber}}*:

📦 Status: *{{status}}*

Thank you for shopping with us!

🌐 sriswastudio.com
— Team Sriswa Studio';
