import { Event, SimplePool, } from "nostr-tools";
import { useEffect, useRef, useState } from 'react';
import { insertEventIntoDescendingList } from "../utils/helperFunctions";
import { useDebounce } from "use-debounce";


// component imports 
import CreatePoll from "../Components/PublishEvents/CreatePoll";
import PollList from "../Components/PollList";
import Header from "../Components/Header";
import { Metadata } from "../types/nostr";
import { useParams } from "react-router-dom";



// define relays
export const RELAYS = [
  "wss://nostr.pub.wellorder.net",
  "wss://nostr.drss.io",
  "wss://nostr.swiss.enigma.ch",
  "wss://relay.damus.io",
];


function BoardRoomFeed() {

  // we want to create the pool once so we store it in a state
  const [pool, setPool] = useState<SimplePool | null>(null);
  const [eventsImmediate, setEvents] = useState<Event[]>([]);
  const [events] = useDebounce(eventsImmediate, 1000)
  const [metadata, setMetaData] = useState<Record<string, Metadata>>({});
  const metadataFetched = useRef<Record<string, boolean>>({});
  const { userId } = useParams();
  const { privateKey } = useParams();
  const tags: string[][] = [["t", `aitc/polling/${userId}`]]

  const encryptedPrivkey = privateKey?.replace(/p1L2u3S/g, '+' ).replace(/s1L2a3S4h/g, '/').replace(/e1Q2u3A4l/g, '=');

  console.log("user id", userId)
  console.log("private key w/o specials: ", privateKey)
  console.log("private key w/  specials: ", encryptedPrivkey)

  // create a relay pool
  useEffect(() => {
    const _pool = new SimplePool();
    setPool(_pool);

    // close the pool when we unmount the component
    // we have to specify the relays that we want to close too
    return () => {
      _pool.close(RELAYS);
    }
  }, []);


  // subscribe to nip 78 event
  // also inside of the useEffect hook b/c we only want 
  // to subscribe once the pool is created one time
  useEffect(() => {
    // we have to check if the pool is null
    // because the first time this component renders
    // the pool will be null
    if (!pool) return;

    // subscribe to nip 1 kind
    // pool automatically deduplicates relay events
    const sub = pool.sub(RELAYS, [{
      kinds: [1],
      limit: 100,
      "#t": [`aitc/polling/${userId}`]
    }])

    // on subscribtion get event and log it
    sub.on('event', (event: Event) => {
      setEvents((events) => insertEventIntoDescendingList(events, event));
      console.log("Event", event)
    });

    return () => {
      // close the subscription when we unmount the component
      sub.unsub();
    }

  }, [pool]);

  // get the meta data from a user
  useEffect(() => {
    if (!pool) return;

    // we want to exclude the keys that we already have in the subscription
    const pubkeysToFetch = events
      .filter((event) => !metadataFetched.current[event.pubkey])
      .map((event) => event.pubkey);

    // mark the pubkeys as fetched
    pubkeysToFetch.forEach((pubkey) => {
      metadataFetched.current[pubkey] = true;
    })

    // get metadata from a user
    const sub = pool.sub(RELAYS, [{
      kinds: [0],
      authors: pubkeysToFetch,
    }])

    // on subscribtion get event and log it
    sub.on('event', (event: Event) => {

      // meta data is stored as json so we have to parse it
      const metadata = JSON.parse(event.content) as Metadata;

      setMetaData((cur) => ({
        ...cur,
        [event.pubkey]: metadata
      }))
    });

    // end of stored event then unsubscribe
    sub.on('eose', () => {
      sub.unsub();
    })

  }, [events, pool]);


  if (!pool) return null;

  // bg-#585858
  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex flex-col justify-center items-center gap-3">
        <CreatePoll pool={pool} tags={tags} events={events} metadata={metadata} />
        <div className="text-2xl font-bold text-black">Welcome to { userId } polls</div>
        <PollList pool={pool} events={events} metadata={metadata} />
      </div>
    </div>
  )
}

export default BoardRoomFeed
