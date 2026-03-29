// Web stub for react-native-gesture-handler
const React = require("react");
const { View } = require("react-native");

const noop = () => {};
const noopHook = () => ({});

const GestureHandlerRootView = ({ children, style }) =>
  React.createElement(View, { style }, children);

const Gesture = {
  Tap: () => ({ onBegin: noopHook, onEnd: noopHook, onFinalize: noopHook, enabled: noopHook, runOnJS: noopHook }),
  Pan: () => ({ onBegin: noopHook, onUpdate: noopHook, onEnd: noopHook, enabled: noopHook, runOnJS: noopHook }),
  Pinch: () => ({ onUpdate: noopHook, onEnd: noopHook, enabled: noopHook }),
  Rotation: () => ({ onUpdate: noopHook, onEnd: noopHook }),
  Fling: () => ({ onBegin: noopHook, onEnd: noopHook }),
  LongPress: () => ({ onBegin: noopHook, onEnd: noopHook }),
  Simultaneous: (...g) => g[0],
  Race: (...g) => g[0],
  Exclusive: (...g) => g[0],
};

const GestureDetector = ({ children }) => children;
const ScrollView = require("react-native").ScrollView;
const FlatList = require("react-native").FlatList;

module.exports = {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  ScrollView,
  FlatList,
  State: {},
  Directions: {},
  gestureHandlerRootHOC: (C) => C,
  PanGestureHandler: ({ children }) => children,
  TapGestureHandler: ({ children }) => children,
  PinchGestureHandler: ({ children }) => children,
  RotationGestureHandler: ({ children }) => children,
  FlingGestureHandler: ({ children }) => children,
  LongPressGestureHandler: ({ children }) => children,
  NativeViewGestureHandler: ({ children }) => children,
  RawButton: View,
  BaseButton: View,
  RectButton: View,
  BorderlessButton: View,
  TouchableOpacity: require("react-native").TouchableOpacity,
  TouchableHighlight: require("react-native").TouchableHighlight,
  TouchableNativeFeedback: require("react-native").TouchableOpacity,
  TouchableWithoutFeedback: require("react-native").TouchableWithoutFeedback,
  Swipeable: View,
  DrawerLayout: View,
  useAnimatedGestureHandler: noopHook,
};
