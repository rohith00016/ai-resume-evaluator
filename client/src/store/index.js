import { configureStore } from "@reduxjs/toolkit";
import resumeReducer from "../features/resumeSlice";

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "resume/uploadResume/pending",
          "resume/uploadResume/fulfilled",
          "resume/uploadResume/rejected",
        ],
      },
    }),
});
