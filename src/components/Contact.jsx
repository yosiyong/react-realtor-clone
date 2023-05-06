import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";

export default function Contact({ userRef, listing }) {
  const { t, i18n } = useTranslation();
    const [landlord, setLandlord] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
      async function getLandlord() {
        console.log('contact userRef:',userRef);
        const docRef = doc(db, "users", userRef);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log('contact data:',docSnap.data());
          setLandlord(docSnap.data());
        } else {
          toast.error(t("Could not get landlord data"));
        }
      }
      //ユーザー情報取得
      getLandlord();
    }, [userRef]);

    //テキスト編集イベント
    const onChange = (e) => {
      setMessage(e.target.value);
    }


    return (
      <>
        {landlord !== null && (
          <div className="flex flex-col w-full">
            <p className="mt-3 mb-3">
            {i18n.resolvedLanguage === "en" ? "Contact " + landlord.name + " for the " + listing.name.toLowerCase() : "「" + listing.name + "」について" + landlord.name + "にお問い合わせします。" }
            </p>
            <div className="mb-3">
              <textarea name="message" id="message" rows="2" value={message} onChange={onChange} className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600"></textarea>
            </div>
            <a href={`mailto:${landlord.email}?Subject=${listing.name}&body=${message}`}>
              <button className="px-7 py-3 bg-blue-600 text-white rounded text-sm uppercase shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out w-full text-center mb-6" type="button">
                {t("Send Message")}
              </button>
            </a>
          </div>
        )}
      </>
    );
}
