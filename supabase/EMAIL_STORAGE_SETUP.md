# Email Images Storage Setup

This guide will help you set up Supabase storage for email images so they display correctly in invitation emails.

## Step 1: Create the Storage Bucket

1. Go to your Supabase project
2. Open the **SQL Editor**
3. Copy and paste the contents of `supabase/email-storage-bucket.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for "Success" message

This creates a public bucket called `email-assets` that allows:
- ✅ Public read access (so email clients can load images)
- ✅ Authenticated users can upload/update/delete images

## Step 2: Upload Images to the Bucket

Run the upload script:

```bash
node scripts/upload-email-images.js
```

This will upload:
- `beagle-text-logo.webp` → `email-assets/beagle-text-logo.webp`
- `realbeagle.png` → `email-assets/realbeagle.png`

**Note:** Make sure your `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Verify Images are Accessible

After uploading, test the URLs in your browser:

```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/email-assets/beagle-text-logo.webp
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/email-assets/realbeagle.png
```

Both should display the images.

## Step 4: Test Email

Send a test invitation and check that:
1. The email is received
2. Images display correctly in the email
3. The invitation link works

## Manual Upload (Alternative)

If the script doesn't work, you can upload manually:

1. Go to **Storage** in Supabase dashboard
2. Click on **email-assets** bucket (or create it if it doesn't exist)
3. Click **Upload file**
4. Upload `public/images/beagle-text-logo.webp` as `beagle-text-logo.webp`
5. Upload `public/realbeagle.png` as `realbeagle.png`
6. Make sure both files are set to **Public**

## Troubleshooting

**Images not showing in emails?**
- Check that the bucket is public
- Verify the URLs are accessible in a browser
- Some email clients block external images - this is normal, users can click "Show images"

**Upload script fails?**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Verify the bucket exists (run the SQL script first)
- Make sure the image files exist in `public/` directory

