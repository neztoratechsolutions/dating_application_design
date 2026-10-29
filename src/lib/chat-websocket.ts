
export function connectChatWebSocket(
  chatId: number,
  token: string,
  onMessage: (data: any) => void
) {
  const wsUrl =
    `${import.meta.env.VITE_WS_BASE_URL}/ws/chat/${chatId}`;

  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: "authenticate",
        token,
      })
    );
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = (event) => {
    console.log("WebSocket disconnected:", event.code);
  };

  return {
    socket,

    sendMessage(content: string) {
      if (socket.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket is not connected");
        return;
      }

      socket.send(
        JSON.stringify({
          type: "message",
          content,
        })
      );
    },

    sendTyping() {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "typing" }));
      }
    },

    disconnect() {
      socket.close();
    },
  };
}
