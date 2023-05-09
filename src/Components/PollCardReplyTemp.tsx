import { Event, SimplePool } from 'nostr-tools';
import { useEffect, useState } from 'react'
import { RELAYS } from '../App';
import { insertEventIntoDescendingList } from '../utils/helperFunctions';

interface Props {
   pool: SimplePool;
   event: {
      id: string;
      pubkey: string;
   };

}

export default function PollCardReplyTemp({ pool, event }: Props) {
   const [pollReply, setPollReply] = useState<Event[]>([]);

   // TODO: make the key identifier for the map unique
   
   // query tags with the same id in their e tag and pub key in their p tag
   useEffect(() => {

      if (!pool) return;

      const sub = pool.sub(RELAYS, [{
         kinds: [1],
         limit: 100,
         "#e": [event.id],
         "#p": [event.pubkey]
      }])

      sub.on("event", (event: Event) => {
         setPollReply((events) => insertEventIntoDescendingList(events, event));
      })

      return () => {
         // close the subscription when we unmount the component
         sub.unsub();
       }

   }, [])
   // on component mount, query for all events with the same id in their e tag and pub key in their p tag

   return (
      <div>
         {
            pollReply.map((events) => (
               // make key unique other than Math.random()
               <div key={Math.random()} className="flex flex-col gap-16">
                  <p>{events.content}</p>
               </div>
            ))
         }
      </div>
   )
}

