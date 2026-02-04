/**
 * Extension Session Sync Script
 * This script syncs Supabase session from the web app to the SmartShield extension
 * Include this in the web app's HTML to enable automatic session syncing
 */

(function() {
  'use strict';
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  console.log('SmartShield Extension Sync loaded');
  
  // Listen for session requests from the extension's content script
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'SMARTSHIELD_REQUEST_SESSION') {
      console.log('Extension requesting session sync');
      syncSessionToExtension();
    }
    
    if (event.data.type === 'SMARTSHIELD_SYNC_CONFIRMED') {
      if (event.data.success) {
        console.log('✓ Session synced successfully to extension');
        // Optionally show a notification to the user
        showSyncNotification(true);
      } else {
        console.error('✗ Failed to sync session to extension:', event.data.error);
        showSyncNotification(false);
      }
    }
  });
  
  // Function to sync the current session to the extension
  function syncSessionToExtension() {
    try {
      // Try to get Supabase session from localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      
      console.log('Found Supabase keys:', supabaseKeys);
      
      // Look for the auth token key (usually sb-{project-ref}-auth-token)
      const authKey = supabaseKeys.find(key => key.includes('auth-token'));
      
      if (!authKey) {
        console.log('No Supabase session found in localStorage');
        return;
      }
      
      const sessionData = localStorage.getItem(authKey);
      if (!sessionData) {
        console.log('Session data is empty');
        return;
      }
      
      const session = JSON.parse(sessionData);
      console.log('Syncing session to extension:', { 
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        hasUser: !!session.user,
        email: session.user?.email 
      });
      
      // Extract tokens for secure hand-off
      const tokens = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user
      };
      
      // Send tokens to extension via content script (token hand-off pattern)
      window.postMessage({
        type: 'SMARTSHIELD_SYNC_SESSION',
        tokens: tokens
      }, window.location.origin);
      
      console.log('✓ Session tokens sent to extension');
      
      // Show notification
      if (session.user?.email) {
        showSyncNotification(true);
      }
      
    } catch (error) {
      console.error('Error syncing session:', error);
    }
  }
  
  // Function to show a brief notification about sync status
  function showSyncNotification(success) {
    // Remove existing notification if any
    const existing = document.getElementById('smartshield-sync-notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'smartshield-sync-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${success ? '#10b981' : '#ef4444'};
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: auto;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">${success ? '✓' : '✗'}</span>
        <span>${success ? 'Extension synced successfully!' : 'Failed to sync extension'}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    console.log('Showing notification:', success);
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Fade out and remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
  
  // Auto-sync on page load (after a delay to ensure Supabase is initialized)
  window.addEventListener('load', function() {
    console.log('Page loaded, checking for existing session...');
    setTimeout(function() {
      syncSessionToExtension();
    }, 1500);
  });
  
  // Also sync when the user logs in (detect localStorage changes)
  window.addEventListener('storage', function(e) {
    if (e.key && e.key.includes('supabase') && e.key.includes('auth-token')) {
      console.log('Detected auth change via storage event, syncing to extension...');
      setTimeout(syncSessionToExtension, 500);
    }
  });
  
  // Watch for Supabase auth state changes (more reliable than storage events in same tab)
  // This catches sign-in events more reliably
  if (window.supabase) {
    console.log('Supabase detected, setting up auth listener...');
    try {
      window.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, { hasSession: !!session });
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          console.log('User signed in/token refreshed, syncing to extension...');
          setTimeout(syncSessionToExtension, 300);
        }
      });
    } catch (error) {
      console.log('Could not set up Supabase auth listener:', error);
    }
  }
  
  // Also monitor for manual sign-in flows by checking periodically
  // (useful if Supabase auth listener doesn't work)
  let lastCheckedSession = null;
  setInterval(function() {
    try {
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') && key.includes('auth-token')
      );
      const authKey = supabaseKeys[0];
      if (authKey) {
        const sessionData = localStorage.getItem(authKey);
        if (sessionData !== lastCheckedSession && sessionData) {
          console.log('Detected session change via polling, syncing...');
          lastCheckedSession = sessionData;
          syncSessionToExtension();
        }
      }
    } catch (error) {
      // Silent fail for polling
    }
  }, 2000);
  
  // Expose a global function for manual sync (can be called from dev tools)
  window.smartshieldSyncExtension = syncSessionToExtension;
  
})();
