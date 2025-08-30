import { configureStore } from "@reduxjs/toolkit";
import resumeReducer from "../features/resumeSlice";
import authReducer from "../features/authSlice";

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
    auth: authReducer,
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
