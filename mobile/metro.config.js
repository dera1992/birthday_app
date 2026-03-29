const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Apply NativeWind first
const finalConfig = withNativeWind(config, { input: "./global.css" });

const rnDir = path.resolve(__dirname, "node_modules", "react-native") + path.sep;
const originalResolveRequest = finalConfig.resolver?.resolveRequest;

finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    // Native-only modules → stubs
    const webStubs = {
      "@stripe/stripe-react-native": path.resolve(
        __dirname,
        "stubs/stripe-react-native.web.js"
      ),
      "sonner-native": path.resolve(__dirname, "stubs/sonner-native.web.js"),
      "react-native-gesture-handler": path.resolve(
        __dirname,
        "stubs/gesture-handler.web.js"
      ),
    };
    if (webStubs[moduleName]) {
      return { type: "sourceFile", filePath: webStubs[moduleName] };
    }

    // gesture-handler sub-paths → empty (stub handles the top-level)
    if (moduleName.startsWith("react-native-gesture-handler/")) {
      return { type: "empty" };
    }

    // reanimated on web → empty (CSS handles animations)
    if (
      moduleName === "react-native-reanimated" ||
      moduleName.startsWith("react-native-reanimated/")
    ) {
      return { type: "empty" };
    }

    // Top-level react-native → react-native-web
    if (moduleName === "react-native") {
      return context.resolveRequest(context, "react-native-web", platform);
    }

    // react-native/* subpaths → try react-native-web equivalent, else stub
    if (moduleName.startsWith("react-native/")) {
      const rnWebPath =
        "react-native-web/" + moduleName.slice("react-native/".length);
      try {
        return context.resolveRequest(context, rnWebPath, platform);
      } catch {
        return { type: "empty" };
      }
    }

    // Relative imports originating from inside react-native package → stub
    if (context.originModulePath.startsWith(rnDir)) {
      const absPath = path.resolve(
        path.dirname(context.originModulePath),
        moduleName
      );
      if (absPath.startsWith(rnDir)) {
        const relPath = absPath
          .slice(rnDir.length)
          .replace(/\\/g, "/");
        try {
          return context.resolveRequest(
            context,
            "react-native-web/" + relPath,
            platform
          );
        } catch {
          return { type: "empty" };
        }
      }
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
