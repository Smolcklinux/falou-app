#!/bin/bash
echo "🔧 Gerando autolinking..."
mkdir -p android/build/generated/autolinking
cat > android/build/generated/autolinking/autolinking.json << 'JSON'
{
  "root": "..",
  "reactNativePath": "../node_modules/react-native",
  "project": {
    "ios": {},
    "android": {
      "sourceDir": "./",
      "appName": "app",
      "packageName": "com.falou.app",
      "dependencies": []
    }
  },
  "dependencies": {},
  "healthChecks": []
}
JSON
echo "✅ autolinking.json criado"
