import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function OAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  async function onGoogleClick() {
    try {
      //Google認証
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      //console.log(user);

      //userコレクションに存在チェック
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      //userコレクションに存在しなければ、userコレクションに新規追加
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
      }
      navigate("/");
      
    } catch (error) {
      console.log(error);
      toast.error(t('Google login error'));
    }
  }
  return (
    <button
      type="button"
      onClick={onGoogleClick}
      className="flex items-center justify-center w-full bg-red-700 text-white px-7 py-3 uppercase text-sm font-medium hover:bg-red-800 active:bg-red-900 shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out rounded"
    >
      <FcGoogle className="text-2xl  bg-white rounded-full mr-2" />
      {t('Continue with Google')}
    </button>
  );
}