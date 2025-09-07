import React from 'react';
import { Text, TextProps } from 'react-native';

export function ThemedText(props: TextProps & { children?: React.ReactNode }) {
  return <Text {...props}>{props.children}</Text>;
}
