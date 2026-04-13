import { Button, Heading, Text, View } from "@aws-amplify/ui-react";

type EventAdminSectionProps = {
  isAdmin: boolean;
  eventName: string;
  eventDate: string;
  isSubmitting: boolean;
  onChangeEventName: (value: string) => void;
  onChangeEventDate: (value: string) => void;
  onCreateEvent: () => void;
};

export function EventAdminSection({
  isAdmin,
  eventName,
  eventDate,
  isSubmitting,
  onChangeEventName,
  onChangeEventDate,
  onCreateEvent,
}: EventAdminSectionProps) {
  if (!isAdmin) {
    return <Text marginTop="1.25rem">一般ユーザーとしてログイン中です（イベント作成は管理者のみ）。</Text>;
  }

  return (
    <View marginTop="1.5rem">
      <Heading level={4}>イベント作成（管理者）</Heading>
      <View marginTop="0.75rem">
        <input
          placeholder="イベント名"
          value={eventName}
          onChange={(e) => onChangeEventName(e.target.value)}
        />
      </View>
      <View marginTop="0.75rem">
        <input type="date" value={eventDate} onChange={(e) => onChangeEventDate(e.target.value)} />
      </View>
      <Button marginTop="0.75rem" onClick={onCreateEvent} isLoading={isSubmitting}>
        イベントを作成
      </Button>
    </View>
  );
}
