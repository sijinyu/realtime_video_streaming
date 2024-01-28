/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import socketIOClient, { Socket } from "socket.io-client";

const App: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [selectedBitrate, setSelectedBitrate] = useState<string>("high");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket>();

  useEffect(() => {
    socketRef.current = socketIOClient("http://localhost:3001");
    socketRef.current.on("receiveStream", (streamData: any) => {
      console.log("스트림을 받았습니다:", streamData);
    });

    socketRef.current.on("previousMessages", (prevMessages: string[]) => {
      setMessages(prevMessages); // 이전 메시지를 받아옴
    });

    socketRef.current.on("chat message", (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socketRef.current.on("currentStreamingStatus", (status: boolean) => {
      setIsStreaming(status);
      // 페이지가 로드되었을 때, 스트리밍이 되어 있다면 다시 스트리밍 시작
      console.log(status, "==");
      if (status) {
        startStreaming();
      }
      return () => {
        socketRef.current?.disconnect();
      };
    });
  }, []);
  const startStreaming = async () => {
    try {
      const constraints = { video: true };
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      console.log(videoRef.current);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log("방송 시작");
        socketRef.current?.emit("start streaming", mediaStream);
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("웹캠을 사용할 수 없습니다:", err);
    }
  };

  const sendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputMessage && socketRef.current) {
      socketRef.current.emit("chat message", inputMessage);
      setInputMessage("");
    }
  };

  const handleBitrateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedBitrate(e.target.value);
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit("bitrateChange", selectedBitrate);
    }
  }, [selectedBitrate]);

  useEffect(() => {
    const prevMessage = localStorage.getItem("message");
    console.log(prevMessage);
    if (prevMessage) {
      setMessages(JSON.parse(prevMessage));
    }
  }, []);
  useEffect(() => {
    return () => localStorage.setItem("message", JSON.stringify(messages));
  }, []);
  return (
    <div>
      <div>
        <video ref={videoRef} width="640" height="480" autoPlay></video>
        {isStreaming && (
          <div>
            <form onSubmit={sendMessage}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit">전송</button>
            </form>
            <ul>
              {messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <label>
          <input
            type="radio"
            value="low"
            checked={selectedBitrate === "low"}
            onChange={handleBitrateChange}
          />
          저화질
        </label>
        <label>
          <input
            type="radio"
            value="high"
            checked={selectedBitrate === "high"}
            onChange={handleBitrateChange}
          />
          고화질
        </label>
        <button onClick={startStreaming}>방송 시작하기</button>
      </div>
    </div>
  );
};

export default App;
