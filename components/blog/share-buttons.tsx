"use client";

import { useState, useEffect } from "react";
import { Link2, Check } from "lucide-react";

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: object) => void;
      };
    };
  }
}

type Props = {
  url: string;
  title: string;
  description?: string;
  image?: string;
};

export function ShareButtons({ url, title, description, image }: Props) {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!key) return;

    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) window.Kakao.init(key);
      setKakaoReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (!window.Kakao.isInitialized()) window.Kakao.init(key);
      setKakaoReady(true);
    };
    document.head.appendChild(script);
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareKakao() {
    if (!window.Kakao?.Share) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        ...(description && { description }),
        ...(image && { imageUrl: image }),
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: "글 보기", link: { mobileWebUrl: url, webUrl: url } },
      ],
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-1">공유</span>

      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm hover:bg-muted transition-colors"
        aria-label="링크 복사"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Link2 className="w-3.5 h-3.5" />
        )}
        {copied ? "복사됨" : "링크 복사"}
      </button>

      {kakaoReady && (
        <button
          onClick={shareKakao}
          className="p-2 rounded-full hover:opacity-85 transition-opacity"
          aria-label="카카오톡으로 공유"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="5.5" fill="#FEE500"/>
            <path
              d="M12 5C8.134 5 5 7.462 5 10.5c0 1.946 1.17 3.657 2.95 4.693L7.2 18l3.342-2.198A8.3 8.3 0 0 0 12 16c3.866 0 7-2.462 7-5.5S15.866 5 12 5z"
              fill="#3A1D1D"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
