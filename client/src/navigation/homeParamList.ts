/**
 * The destinations the tabs and the landscape rail share. Kept out of the
 * navigator module so the screens can type their navigation without importing
 * the file that renders them.
 */
export type HomeParamList = {
  Home: undefined;
  Tasks: undefined;
  Calendar: { date?: string } | undefined;
  Stats: undefined;
  Subjects: undefined;
};
