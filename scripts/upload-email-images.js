/**
 * Script to upload email images to Supabase storage bucket
 * 
 * Run this with: node scripts/upload-email-images.js
 * 
 * Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })
  
  return env
}

const env = loadEnvFile()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadImage(filePath, fileName) {
  try {
    const fileContent = fs.readFileSync(filePath)
    
    const { data, error } = await supabase.storage
      .from('email-assets')
      .upload(fileName, fileContent, {
        contentType: getContentType(fileName),
        upsert: true, // Replace if exists
      })

    if (error) {
      console.error(`Error uploading ${fileName}:`, error)
      return false
    }

    console.log(`✅ Uploaded ${fileName}`)
    return true
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return false
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  return types[ext] || 'image/png'
}

async function main() {
  console.log('📤 Uploading email images to Supabase storage...\n')

  const images = [
    {
      localPath: path.join(__dirname, '../public/images/newbeaglelogo.png'),
      fileName: 'newbeaglelogo.png',
    },
    {
      localPath: path.join(__dirname, '../public/trudy-cute-dog.png'),
      fileName: 'trudy-cute-dog.png',
    },
  ]

  for (const image of images) {
    if (!fs.existsSync(image.localPath)) {
      console.warn(`⚠️  File not found: ${image.localPath}`)
      continue
    }

    await uploadImage(image.localPath, image.fileName)
  }

  console.log('\n✨ Done!')
  console.log('\n📧 Your email images are now available at:')
  console.log(`   ${supabaseUrl}/storage/v1/object/public/email-assets/newbeaglelogo.png`)
  console.log(`   ${supabaseUrl}/storage/v1/object/public/email-assets/trudy-cute-dog.png`)
}

main().catch(console.error)

