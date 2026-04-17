import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";
import { isEventStatus, type EventStatus } from "../../lib/schemaTypes";

type EventListSectionProps = {
  events: Array<Schema["Event"]["type"]>;
  isAdmin: boolean;
  isUpdatingStatus: boolean;
  onChangeEventStatus: (eventId: string, status: EventStatus) => void;
  onOpenEventPage: (eventId: string) => void;
};

export function EventListSection({
  events,
  isAdmin,
  isUpdatingStatus,
  onChangeEventStatus,
  onOpenEventPage,
}: EventListSectionProps) {
  const getStatusLabel = (status: Schema["Event"]["type"]["status"]): string => {
    if (status === "close") {
      return "終了";
    }
    return "公開中";
  };

  return (
    <View marginTop="1.5rem">
      <Heading level={4}>イベント一覧</Heading>
      {events.length === 0 ? (
        <Text marginTop="0.75rem">イベントはまだありません。</Text>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.eventId} style={{ marginBottom: "0.5rem" }}>
              {event.eventDate} - {event.name}
              {isAdmin && ` [${getStatusLabel(event.status)}]`}
              {event.isTest && " [テスト]"}
              <Button size="small" marginLeft="0.5rem" onClick={() => onOpenEventPage(event.eventId)}>
                イベントページを開く
              </Button>
              {isAdmin && (
                <>
                  <select
                    style={{ marginLeft: "0.5rem" }}
                    value={event.status ?? "open"}
                    aria-label="イベント状態"
                    onChange={(e) => {
                      if (!isEventStatus(e.target.value)) {
                        return;
                      }
                      onChangeEventStatus(event.eventId, e.target.value);
                    }}
                    disabled={isUpdatingStatus}
                  >
                    <option value="open">公開中</option>
                    <option value="close">終了</option>
                  </select>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </View>
  );
}
