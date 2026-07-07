import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5F3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#115C55',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export const MapView = React.forwardRef((props: any, ref: any) => {
  return React.createElement(
    View,
    { style: [webStyles.container, props.style], ref },
    React.createElement(Text, { style: webStyles.icon }, '🗺️'),
    React.createElement(Text, { style: webStyles.title }, 'Map Preview'),
    React.createElement(
      Text,
      { style: webStyles.subtitle },
      'Interactive map available on mobile'
    ),
    props.children
  );
});
MapView.displayName = 'MapView';

export default MapView;
export const Marker = (_props: any) => null;
Marker.displayName = 'Marker';
export const Circle = (_props: any) => null;
Circle.displayName = 'Circle';
export const Polyline = (_props: any) => null;
Polyline.displayName = 'Polyline';
export const PROVIDER_GOOGLE = null;
