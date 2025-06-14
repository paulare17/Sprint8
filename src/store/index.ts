import { configureStore } from "@reduxjs/toolkit";


export const store = configureStore({
  reducer: {
  },
});

// Types per a TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;