import type { StyleProp, ViewStyle } from 'react-native';
import { Avatar, useTheme, type MD3Theme } from 'react-native-paper';

/**
 * MD3 tonal roles stand in for the custom hues a bespoke palette would use, so
 * subjects stay distinguishable while everything stays in the theme.
 */
export function subjectAccent(theme: MD3Theme, index: number) {
  const accents = [
    {
      background: theme.colors.primaryContainer,
      foreground: theme.colors.onPrimaryContainer,
    },
    {
      background: theme.colors.secondaryContainer,
      foreground: theme.colors.onSecondaryContainer,
    },
    {
      background: theme.colors.tertiaryContainer,
      foreground: theme.colors.onTertiaryContainer,
    },
  ];

  return accents[index % accents.length];
}

type SubjectAvatarProps = {
  name: string;
  index: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function SubjectAvatar({
  name,
  index,
  size = 40,
  style,
}: SubjectAvatarProps) {
  const theme = useTheme();
  const accent = subjectAccent(theme, index);

  return (
    <Avatar.Text
      size={size}
      label={name.trim().charAt(0).toUpperCase() || '?'}
      color={accent.foreground}
      style={[style, { backgroundColor: accent.background }]}
    />
  );
}
