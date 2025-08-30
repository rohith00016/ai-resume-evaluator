import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Async thunks
export const uploadResume = createAsyncThunk(
  "resume/uploadResume",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/resume`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Upload failed" }
      );
    }
  }
);

export const fetchEvaluations = createAsyncThunk(
  "resume/fetchEvaluations",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_BASE_URL}/learners`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: "Fetch failed" });
    }
  }
);

export const sendFeedbackEmail = createAsyncThunk(
  "resume/sendFeedbackEmail",
  async (evaluationId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post(
        `${API_BASE_URL}/send-feedback`,
        {
          evaluationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Email send failed" }
      );
    }
  }
);

const initialState = {
  evaluations: [],
  currentEvaluation: null,
  loading: false,
  error: null,
  uploadProgress: 0,
};

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEvaluation: (state) => {
      state.currentEvaluation = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Resume
      .addCase(uploadResume.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvaluation = action.payload.learner;
        state.evaluations.unshift(action.payload.learner);
        state.uploadProgress = 100;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Upload failed";
        state.uploadProgress = 0;
      })
      // Fetch Evaluations
      .addCase(fetchEvaluations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluations.fulfilled, (state, action) => {
        state.loading = false;
        state.evaluations = action.payload;
      })
      .addCase(fetchEvaluations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Fetch failed";
      })
      // Send Email
      .addCase(sendFeedbackEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFeedbackEmail.fulfilled, (state, action) => {
        state.loading = false;
        // Update the evaluation to mark email as sent
        const index = state.evaluations.findIndex(
          (evaluation) => evaluation._id === action.payload.evaluationId
        );
        if (index !== -1) {
          state.evaluations[index].emailSent = true;
          state.evaluations[index].emailSentAt = new Date().toISOString();
        }
      })
      .addCase(sendFeedbackEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Email send failed";
      });
  },
});

export const { clearError, clearCurrentEvaluation, setUploadProgress } =
  resumeSlice.actions;
export default resumeSlice.reducer;
