import React from 'react';

export interface ItineraryNode {
  airport: string;
  airport_name?: string;
  is_layover?: boolean;
  layover_minutes?: number;
}

export interface ItinerarySegment {
  duration_minutes: number;
  flight_number?: string;
  carrier?: string;
}

export interface FlightItinerary {
  nodes: ItineraryNode[];
  segments: ItinerarySegment[];
  partial?: boolean;
}

export function formatMinutesDuration(minutes: number): string {
  if (minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

function nodeLabel(node: ItineraryNode): string {
  return node.airport;
}

export function FlightItineraryTimeline({ itinerary }: { itinerary: FlightItinerary }) {
  const { nodes, segments, partial } = itinerary;
  if (nodes.length < 2 || segments.length < 1) return null;

  return (
    <div className="flight-itinerary" aria-label="Flight route timeline">
      <div className="flight-itinerary-track">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const segment = segments[index];
          const isLayover = Boolean(node.is_layover);

          return (
            <React.Fragment key={`${node.airport}-${index}`}>
              <div className="flight-itinerary-node-col">
                <div className="flight-itinerary-layover-slot">
                  {node.layover_minutes ? (
                    <span className="flight-itinerary-layover">
                      {formatMinutesDuration(node.layover_minutes)}
                    </span>
                  ) : null}
                </div>
                <div className="flight-itinerary-dot-row">
                  <span
                    className={`flight-itinerary-dot${isLayover ? ' flight-itinerary-dot--layover' : ' flight-itinerary-dot--endpoint'}`}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={`flight-itinerary-label${isLayover ? ' flight-itinerary-label--layover' : ''}`}
                  title={isLayover && node.airport_name ? node.airport_name : undefined}
                >
                  {nodeLabel(node)}
                </span>
              </div>
              {!isLast && segment ? (
                <div
                  className="flight-itinerary-segment"
                  aria-label={`${formatMinutesDuration(segment.duration_minutes)} in the air`}
                >
                  <span className="flight-itinerary-segment-duration">
                    {formatMinutesDuration(segment.duration_minutes)}
                  </span>
                  <div className="flight-itinerary-segment-line" aria-hidden="true" />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      {partial ? (
        <p className="flight-itinerary-note">Stop airports and layover times unavailable for this fare.</p>
      ) : null}
    </div>
  );
}
