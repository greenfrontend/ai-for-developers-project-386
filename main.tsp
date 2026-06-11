import "@typespec/http";

using Http;

@service(#{ title: "Event Types API" })
namespace EventTypesApi;

model EventType {
  id: string;
  title: string;
  durationMinutes: int32;
}

@route("/event-types")
interface EventTypes {
  @get list(): EventType[];
}
