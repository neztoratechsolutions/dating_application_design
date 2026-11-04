
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CREATORS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type CallStatus =
  | "idle"
  | "ringing"
  | "connecting"
  | "accepted"
  | "rejected"
  | "ended";

type VoiceCallResponse = {
  id?: number;
  call_id?: number;
  caller_id?: number;
  receiver_id?: number;
  status?: string;
  message?: string;
  duration?: number;
};

export const Route = createFileRoute("/app/call/voice/$id")({
  component: VoiceCall,
});

function VoiceCall() {
  const { id } = useParams({
    from: "/app/call/voice/$id",
  });

  const navigate = useNavigate();
  const auth = useAuth();

  const creator = CREATORS.find(
    (item) => String(item.id) === String(id),
  );

  const [callStatus, setCallStatus] =
    useState<CallStatus>("idle");

  const [callId, setCallId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Change these fields according to your auth-store structure.
  const currentUser = auth.user;

  const currentUserId = currentUser?.id;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callStatus !== "accepted") {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      return;
    }

    timerRef.current = window.setInterval(() => {
      setDuration((previous) => previous + 1);
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const getErrorMessage = async (response: Response) => {
    try {
      const data = await response.json();

      return (
        data.detail ||
        data.message ||
        `Request failed with status ${response.status}`
      );
    } catch {
      return `Request failed with status ${response.status}`;
    }
  };

  const initiateCall = async () => {
    if (!creator) {
      toast.error("Creator not found");
      return;
    }

    if (!currentUserId) {
      toast.error("Please login to make a call");
      return;
    }

    if (String(currentUserId) === String(creator.id)) {
      toast.error("You cannot call yourself");
      return;
    }

    try {
      setLoading(true);
      setCallStatus("ringing");

      const response = await fetch(
        `${API_BASE_URL}/voice-calls/initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            caller_id: Number(currentUserId),
            receiver_id: Number(creator.id),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: VoiceCallResponse = await response.json();

      const newCallId = data.call_id ?? data.id;

      if (!newCallId) {
        throw new Error("Call ID was not returned by the server");
      }

      if (!mountedRef.current) return;

      setCallId(newCallId);
      setCallStatus("ringing");

      toast.success("Calling creator...");
    } catch (error) {
      if (!mountedRef.current) return;

      setCallStatus("idle");

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to initiate call",
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const acceptCall = async () => {
    if (!callId) {
      toast.error("Call ID is missing");
      return;
    }

    try {
      setLoading(true);
      setCallStatus("connecting");

      const response = await fetch(
        `${API_BASE_URL}/voice-calls/${callId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      if (!mountedRef.current) return;

      setCallStatus("accepted");

      toast.success("Call accepted");
    } catch (error) {
      if (!mountedRef.current) return;

      setCallStatus("ringing");

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to accept call",
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const rejectCall = async () => {
    if (!callId) {
      setCallStatus("ended");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/voice-calls/${callId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setCallStatus("rejected");

      toast.info("Call rejected");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reject call",
      );
    } finally {
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (!callId) {
      setCallStatus("ended");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/voice-calls/${callId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setCallStatus("ended");

      toast.info("Call ended");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to end call",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (
      callStatus === "accepted" ||
      callStatus === "ringing" ||
      callStatus === "connecting"
    ) {
      toast.error("Please end the call before leaving");
      return;
    }

    navigate({
      to: "/app",
    });
  };

  if (!creator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-gray-500" />

          <h1 className="text-2xl font-bold">
            Creator Not Found
          </h1>

          <p className="mt-2 text-gray-400">
            No creator found with ID {id}
          </p>

          <button
            onClick={handleBack}
            className="mt-6 rounded-lg bg-white px-5 py-2 text-black"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const isCallActive =
    callStatus === "ringing" ||
    callStatus === "connecting" ||
    callStatus === "accepted";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-black to-gray-900 px-6 text-white">
      <button
        onClick={handleBack}
        className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-gray-800">
            {creator.avatar ? (
              <img
                src={creator.avatar}
                alt={creator.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-gray-400" />
            )}
          </div>

          {callStatus === "ringing" && (
            <div className="absolute inset-0 animate-ping rounded-full border border-green-400/40" />
          )}
        </div>

        <h1 className="text-3xl font-bold">
          {creator.name}
        </h1>

        <p className="mt-2 text-gray-400">
          {callStatus === "idle" && "Voice call"}
          {callStatus === "ringing" && "Calling..."}
          {callStatus === "connecting" && "Connecting..."}
          {callStatus === "accepted" && "Connected"}
          {callStatus === "rejected" && "Call rejected"}
          {callStatus === "ended" && "Call ended"}
        </p>

        {callStatus === "accepted" && (
          <p className="mt-4 font-mono text-xl text-green-400">
            {formatDuration(duration)}
          </p>
        )}

        {callStatus === "ringing" && (
          <p className="mt-4 animate-pulse text-sm text-green-400">
            Waiting for creator to accept...
          </p>
        )}

        <div className="mt-12 flex items-center justify-center gap-5">
          {callStatus === "idle" && (
            <button
              onClick={initiateCall}
              disabled={loading}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 transition hover:bg-green-600 disabled:opacity-50"
            >
              <Phone className="h-7 w-7" />
            </button>
          )}

          {callStatus === "ringing" && (
            <>
              <button
                onClick={rejectCall}
                disabled={loading}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600 disabled:opacity-50"
                title="Reject call"
              >
                <PhoneOff className="h-7 w-7" />
              </button>

              <button
                onClick={acceptCall}
                disabled={loading}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 transition hover:bg-green-600 disabled:opacity-50"
                title="Accept call"
              >
                <Phone className="h-7 w-7" />
              </button>
            </>
          )}

          {(callStatus === "connecting" ||
            callStatus === "accepted") && (
            <>
              <button
                onClick={() => setIsMuted((value) => !value)}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                  isMuted
                    ? "bg-white text-black"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>

              <button
                onClick={endCall}
                disabled={loading}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600 disabled:opacity-50"
                title="End call"
              >
                <PhoneOff className="h-7 w-7" />
              </button>

              <button
                onClick={() =>
                  setIsSpeakerOn((value) => !value)
                }
                className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                  isSpeakerOn
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-white text-black"
                }`}
                title={isSpeakerOn ? "Speaker on" : "Speaker off"}
              >
                {isSpeakerOn ? (
                  <Volume2 className="h-6 w-6" />
                ) : (
                  <VolumeX className="h-6 w-6" />
                )}
              </button>
            </>
          )}

          {(callStatus === "ended" ||
            callStatus === "rejected") && (
            <button
              onClick={() => {
                setCallStatus("idle");
                setCallId(null);
                setDuration(0);
                setIsMuted(false);
                setIsSpeakerOn(true);
              }}
              className="rounded-full bg-green-500 px-8 py-3 font-semibold hover:bg-green-600"
            >
              Call Again
            </button>
          )}
        </div>

        {loading && (
          <p className="mt-6 text-sm text-gray-400">
            Please wait...
          </p>
        )}

        {callStatus === "idle" && (
          <p className="mt-8 text-sm text-gray-500">
            Tap the green button to start your call
          </p>
        )}
      </div>
    </div>
  );
}
