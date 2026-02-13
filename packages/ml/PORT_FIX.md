# 🔧 Fixed: Railway Build Errors

## ✅ Issue 1: "undefined variable 'pip'" (Nixpacks Error)

**Error:**
```
error: undefined variable 'pip'
at /app/.nixpacks/nixpkgs-*.nix:19:9:
```

**Root Cause:** 
In Nix, `pip` is not a standalone package. It comes bundled with Python, so trying to install it separately causes an error.

**Solution:**
Removed `pip` from the `nixPkgs` array in nixpacks.toml files. Python 3.10 includes pip automatically.

**Files Fixed:**
- [nixpacks.toml](../../nixpacks.toml) - Root config for monorepo
- [packages/ml/nixpacks.toml](nixpacks.toml) - Package-specific config

**Changed:**
```toml
# Before (WRONG)
nixPkgs = ["python310", "pip", "gcc", "zlib"]

# After (CORRECT)
nixPkgs = ["python310", "gcc", "zlib"]
```

Also updated to use `python -m pip` instead of just `pip` for better reliability.

---

## ✅ Issue 2: "$PORT is not a valid port number"

The error occurred because Railway wasn't properly expanding the `$PORT` environment variable in the start command.

**Solution:** Created a Python startup script ([start.py](start.py)) that:
- Reads the PORT environment variable properly
- Provides a fallback to port 8000 if PORT isn't set
- Starts Gunicorn with the correct port

## 📝 Files Changed

1. **[start.py](start.py)** - New Python startup script (recommended)
2. **[start.sh](start.sh)** - Alternative bash script
3. **[Procfile](Procfile)** - Now uses: `python start.py`
4. **[nixpacks.toml](nixpacks.toml)** - Updated start command
5. **[../../../railway.toml](../../../railway.toml)** - Updated start command
6. **[../../../Dockerfile](../../../Dockerfile)** - Updated CMD

## 🚀 Next Steps

1. **Commit and push these changes:**
   ```bash
   git add .
   git commit -m "Fix Nixpacks pip error and PORT variable handling"
   git push
   ```

2. **Railway will auto-deploy** or manually trigger redeploy

3. **Check the logs** - You should now see:
   ```
   🚀 Starting SmartShield ML API
   PORT: 8000 (or whatever Railway assigns)
   Workers: 1
   ```

4. **Health check should pass** ✅

## 🧪 Test Locally

You can test the startup script locally:

```bash
cd packages/ml

# Set PORT manually
export PORT=5000

# Run the startup script
python start.py
```

You should see:
```
==================================================
🚀 Starting SmartShield ML API
PORT: 5000
Workers: 1
==================================================
[INFO] Starting gunicorn...
```

## 💡 Why This Works

**Before:** 
```bash
gunicorn --bind 0.0.0.0:$PORT ...
# Railway couldn't expand $PORT properly
```

**After:**
```python
# Python reads environment variable directly
port = os.environ.get('PORT', '8000')
# Builds command with actual port number
cmd = ['gunicorn', f'--bind=0.0.0.0:{port}', ...]
```

Python's `os.environ.get()` reliably reads environment variables across all platforms and deployment environments.

## ✅ Verification

After deploy, check Railway logs for this output:

```
==================================================
🚀 Starting SmartShield ML API
PORT: <assigned_port>
Workers: 1
==================================================
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:<assigned_port>
[INFO] Using worker: sync
[INFO] Booting worker with pid: <pid>
```

If you see this, the fix worked! 🎉
