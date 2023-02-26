import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const lngs = {
  en: {nativeName: 'English'},
  ja: {nativeName: '日本語'}
};

export default function Header() {
  const { t,i18n } = useTranslation();

  const [pageState, setPageState] = useState(t("Sign in"));
  const location = useLocation();
  const navigate = useNavigate();
  // console.log(location)

  //ログイン状態によって、ログイン、プロフィールメニュー表示を切り替える
  const auth = getAuth();
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setPageState(t("Profile"));
      } else {
        setPageState(t("Sign in"));
      }
    });
  },[auth]);

  //multilingual 
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setPageState(t("Profile"));
      } else {
        setPageState(t("Sign in"));
      }
    });
  },[i18n.resolvedLanguage]);

  function pathMatchRoute(route) {

    if (route === location.pathname){
      return true
    }
  }

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-40">
      <header className="flex justify-between items-center px-3 max-w-6xl mx-auto">
        <div>
          <img src="https://static.rdc.moveaws.com/images/logos/rdc-logo-default.svg" 
          alt="logo" 
          className="h-5 cursor-pointer" 
          onClick={()=>navigate("/")}/>
        </div>
        <div>
          <ul className="flex space-x-10">
            <li className={`cursor-pointer py-3 text-sm font-semibold text-gray-400 border-b-[3px] border-b-transparent ${pathMatchRoute("/") && "text-black border-b-red-500"}`} 
            onClick={() => navigate("/")}>{t('Home')}</li>
            
            <li className={`cursor-pointer py-3 text-sm font-semibold text-gray-400 border-b-[3px] border-b-transparent ${pathMatchRoute("/offers") && "text-black border-b-red-500"}`} 
            onClick={() => navigate("/offers")}>{t('Offers')}</li>
            
            <li className={`cursor-pointer py-3 text-sm font-semibold text-gray-400 border-b-[3px] border-b-transparent ${(pathMatchRoute("/sign-in") || pathMatchRoute("/profile")) && "text-black border-b-red-500"}`} 
            onClick={() => navigate("/profile")}>{pageState}</li>
            
            {Object.keys(lngs).map((lng) => (
              <li key={lng} className={`cursor-pointer py-3 text-sm font-semibold text-gray-400 border-b-[3px] border-b-transparent ${i18n.resolvedLanguage === lng && "text-black border-b-red-500"}`} 
            onClick={() => i18n.changeLanguage(lng)}>{lngs[lng].nativeName}</li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  )
}
