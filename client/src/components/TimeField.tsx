import { useState } from 'react';
import { View } from 'react-native';
import { TextInput, TouchableRipple } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';

import { timeLabel } from '../study/date';

type TimeFieldProps = {
  label: string;
  /** Local `HH:mm`, or an empty string before one is chosen. */
  value: string;
  error?: boolean;
  onChange: (value: string) => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

function parts(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(':').map(Number);

  return {
    hours: Number.isInteger(hours) && hours >= 0 && hours < 24 ? hours : 9,
    minutes: Number.isInteger(minutes) && minutes >= 0 && minutes < 60 ? minutes : 0,
  };
}

/**
 * A read-only time field that opens the Paper time picker. Keeping `HH:mm` as
 * the stored value means reminders and tasks share one format.
 */
export function TimeField({ label, value, error, onChange }: TimeFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableRipple
        borderless
        onPress={() => setOpen(true)}
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
      >
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={value ? timeLabel(value) : ''}
            placeholder="Choose a time"
            editable={false}
            error={error}
            right={<TextInput.Icon icon="clock-outline" />}
          />
        </View>
      </TouchableRipple>
      <TimePickerModal
        visible={open}
        locale="en"
        use24HourClock
        hours={parts(value).hours}
        minutes={parts(value).minutes}
        onDismiss={() => setOpen(false)}
        onConfirm={({ hours, minutes }) => {
          onChange(`${pad(hours)}:${pad(minutes)}`);
          setOpen(false);
        }}
      />
    </>
  );
}
