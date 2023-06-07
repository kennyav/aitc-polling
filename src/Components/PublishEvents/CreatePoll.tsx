import { useState } from "react";
import { RELAYS } from "../../App";
import { Metadata } from "../../types/nostr";
import NostrImg, { UploadResult } from "../../upload/Nostrimg";
import DropDownMenu from "./DDPollType";
import CryptoJS from 'crypto-js';

// nostr imports
import {
   Event,
   getEventHash,
   SimplePool,
   getPublicKey,
   signEvent,
   UnsignedEvent
} from "nostr-tools";




interface Props {
   encryptedPrivkey: string;
   pool: SimplePool;
   events: Event[];
   metadata: Record<string, Metadata>;
   tags: string[][];
}

export default function CreatePoll({ pool, tags, encryptedPrivkey, events, metadata }: Props) {
   const [input, setInput] = useState("");
   const [imgInput, setImgInput] = useState("");

   const [image, setImage] = useState<UploadResult | null>(null);

   const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // if (!window.nostr) {
      //    alert("Nostr extension not found");
      //    return;
      // }

      // Construct the event object
      let result = input.concat(" ").concat(imgInput);
      console.log(result);

      const _baseEvent = {
         kind: 1,
         created_at: Math.round(Date.now() / 1000),
         tags: tags,
         content: result,
         pubkey: getPublicKey(JSON.parse(CryptoJS.AES.decrypt(encryptedPrivkey, 'AITCSunrise').toString(CryptoJS.enc.Utf8))),
      } as UnsignedEvent;

      try {
         const _event = {
           ..._baseEvent,
           sig: signEvent(_baseEvent, JSON.parse(CryptoJS.AES.decrypt(encryptedPrivkey, 'AITCSunrise').toString(CryptoJS.enc.Utf8))),
           id: getEventHash(_baseEvent),
         } as Event;
   
         if (!pool) return;
         const pubs = pool.publish(RELAYS, _event);

         let clearedInput = false;
         pubs.on("ok", () => {
            if (clearedInput) return;
            clearedInput = true;
            setInput("");
            setImgInput("");
            setImage(null);
         });
       } catch (error) {
         console.log(error);
         alert("Metadata failed to be published");
       }

      
   };

   async function handleImageSelection(e: any) {
      const selectedImage = e.target.files[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

      // Check if the selected file is an image
      if (!selectedImage || !allowedTypes.includes(selectedImage.type)) {
         alert('Please select an image file (png, jpg, jpeg, gif, webp)');
         return;
      }

      const image = await NostrImg(selectedImage);
      console.log(image);
      // Perform operations with the selected image file
      setImage(image)
      setImgInput(image.url!)
      console.log('Selected image:', selectedImage);
   }


   return (
      <div className="bg-white shadow-md p-6 rounded-lg w-1/2">
         <form onSubmit={onSubmit}>
            <textarea
               placeholder="What's on your mind?"
               className="w-full resize-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-4 py-2 text-gray-700 leading-tight"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               rows={3}
            />
            <div className="flex justify-between mt-4">
               <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleImageSelection}
                  className="hidden"
               />
               <label
                  htmlFor="image-input"
                  className="cursor-pointer font-medium hover:bg-gray-200 text-black py-2 px-4 rounded-lg"
               >
                  Picture
               </label>
               <DropDownMenu />
               <button
                  type="submit"
                  className="font-medium hover:bg-gray-200 text-black py-2 px-4 rounded-lg"
               >
                  Post
               </button>
            </div>
            <div className="flex justify-center mt-4">
               <img className="object-fit" src={image?.url} alt="" />
            </div>
         </form>
      </div>

   );
}


{/* 
// Sign this event (allow the user to sign it with their private key)
      // // check if the user has a nostr extension
      try {
         const pubkey = await window.nostr.getPublicKey();

         const sig = (await window.nostr.signEvent(_baseEvent)).sig;

         const event: Event = {
            ..._baseEvent,
            sig,
            pubkey,
            id: getEventHash({ ..._baseEvent, pubkey }),
         };

         const pubs = pool.publish(RELAYS, event);

         let clearedInput = false;

         pubs.on("ok", () => {
            if (clearedInput) return;

            clearedInput = true;
            setInput("");
            setImage(null);
         });
      } catch (error) {
         console.log(error)
         alert("User rejected operation");
      }
*/}