"use client"

import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Add to src/app/lib/supabase.ts or create new file

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const { data: socialAccounts, error: socialError } = await supabase
    .from('user_social_accounts')
    .select('*')
    .eq('user_id', userId)

  if (socialError) throw socialError

  return {
    ...user,
    socialAccounts
  }
}

// Get authentication methods for a user
export async function getUserAuthMethods(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_social_accounts')
    .select('provider, email, created_at')
    .eq('user_id', userId)

  if (error) throw error
  return data
}

// Save scan result to extension_activity table
export async function saveScanResult(userId: string, scanData: {
  url: string
  domain: string
  confidence: number
  decision: string
  prediction: any
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('extension_activity')
    .insert({
      user_id: userId,
      url: scanData.url,
      domain: scanData.domain,
      confidence: scanData.confidence,
      decision: scanData.decision,
      prediction: scanData.prediction
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get today's scan results for a user
export async function getTodaysScans(userId: string) {
  const supabase = createClient()
  
  // Get start of today in UTC
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('extension_activity')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Add safe domain to whitelist
export async function addToWhitelist(domain: string, userId: string, reason?: string) {
  const supabase = createClient()
  
  try {
    // Check if already exists
    const { data: existing, error: selectError } = await supabase
      .from('whitelist')
      .select('id')
      .eq('domain', domain)
      .maybeSingle()
    
    // If table doesn't exist or other error, skip
    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('Whitelist table error:', selectError)
      return null
    }
    
    if (existing) return existing
    
    const { data, error } = await supabase
      .from('whitelist')
      .insert({
        domain: domain,
        reason: reason || 'AI-verified safe site',
        added_by: userId
      })
      .select()
      .single()

    if (error) {
      // Ignore duplicate or permission errors
      if (error.code === '23505' || error.code === '42501') {
        return null
      }
      console.warn('Error adding to whitelist:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.warn('Whitelist operation failed:', err)
    return null
  }
}

// Add phishing site to blacklist
export async function addToBlacklist(domain: string, userId: string, reason?: string) {
  const supabase = createClient()
  
  try {
    // Check if already exists
    const { data: existing, error: selectError } = await supabase
      .from('blacklist')
      .select('id')
      .eq('domain', domain)
      .maybeSingle()
    
    // If table doesn't exist or other error, skip
    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('Blacklist table error:', selectError)
      return null
    }
    
    if (existing) return existing
    
    const { data, error } = await supabase
      .from('blacklist')
      .insert({
        domain: domain,
        reason: reason || 'AI-detected phishing site',
        added_by: userId
      })
      .select()
      .single()

    if (error) {
      // Ignore duplicate or permission errors
      if (error.code === '23505' || error.code === '42501') {
        return null
      }
      console.warn('Error adding to blacklist:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.warn('Blacklist operation failed:', err)
    return null
  }
}

// Add phishing site details
export async function addToPhishingSites(url: string, domain: string, prediction: any) {
  const supabase = createClient()
  
  try {
    // Check if already exists
    const { data: existing, error: selectError } = await supabase
      .from('phishing_sites')
      .select('id')
      .eq('url', url)
      .maybeSingle()
    
    // If table doesn't exist or other error, skip
    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('Phishing sites table error:', selectError)
      return null
    }
    
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('phishing_sites')
        .update({
          prediction: prediction,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        console.warn('Error updating phishing site:', error)
        return null
      }
      return data
    }
    
    const { data, error } = await supabase
      .from('phishing_sites')
      .insert({
        url: url,
        domain: domain,
        prediction: prediction
      })
      .select()
      .single()

    if (error) {
      console.warn('Error adding phishing site:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.warn('Phishing sites operation failed:', err)
    return null
  }
}
