import mongoose from "mongoose";

const MOJIBAKE_PATTERN = /(à¤|à¥|â‚|âœ|ï¸|ðŸ|â|â€”|â€|Ã)/;

function decodeMojibakeText(value) {
  if (typeof value !== "string" || !MOJIBAKE_PATTERN.test(value)) return value;
  try {
    const bytes = Uint8Array.from(
      Array.from(value, (ch) => ch.charCodeAt(0) & 0xff),
    );
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded || value;
  } catch {
    return value;
  }
}

const jobPostingSchema = new mongoose.Schema(
  {
    advtNo: {
      type: String,
      required: [true, "Advertisement number is required"],
      unique: true,
      trim: true,
    },
    // Single combined title (English + Hindi together if needed)
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    post: {
      en: {
        type: String,
        required: [true, "Post name (English) is required"],
        trim: true,
      },
      hi: {
        type: String,
        required: [true, "Post name (Hindi) is required"],
        trim: true,
      },
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    income: {
      en: {
        type: String,
        required: [true, "Income range (English) is required"],
      },
      hi: {
        type: String,
        required: [true, "Income range (Hindi) is required"],
      },
    },
    incomeMin: {
      type: Number,
      required: true,
    },
    incomeMax: {
      type: Number,
      required: true,
    },
    education: {
      en: {
        type: String,
        default: "",
      },
      hi: {
        type: String,
        default: "",
      },
    },
    location: {
      en: {
        type: String,
        required: [true, "Location (English) is required"],
      },
      hi: {
        type: String,
        required: [true, "Location (Hindi) is required"],
      },
    },
    locationArr: {
      type: [String],
      default: [],
    },
    locationArrHi: {
      type: [String],
      default: [],
    },
    fee: {
      en: {
        type: String,
        default: "₹0",
      },
      hi: {
        type: String,
        default: "₹0",
      },
    },
    feeStructure: {
      male_general: {
        type: String,
        default: "",
      },
      male_obc: {
        type: String,
        default: "",
      },
      male_sc: {
        type: String,
        default: "",
      },
      male_st: {
        type: String,
        default: "",
      },
      male_ews: {
        type: String,
        default: "",
      },
      female_general: {
        type: String,
        default: "",
      },
      female_obc: {
        type: String,
        default: "",
      },
      female_sc: {
        type: String,
        default: "",
      },
      female_st: {
        type: String,
        default: "",
      },
      female_ews: {
        type: String,
        default: "",
      },
    },
    advertisementFile: {
      type: String,
      default: "",
    },
    advertisementFileHi: {
      type: String,
      default: "",
    },
    lastDate: {
      type: String,
      required: [true, "Last date is required"],
    },
    applicationOpeningDate: {
      type: String,
      required: [true, "Application opening date is required"],
    },
    firstMeritListDate: {
      type: String,
      default: "",
    },
    finalMeritListDate: {
      type: String,
      default: "",
    },
    ageLimit: {
      en: {
        type: String,
        required: [true, "Age limit (English) is required"],
      },
      hi: {
        type: String,
        required: [true, "Age limit (Hindi) is required"],
      },
    },
    ageAsOn: {
      type: String,
      required: true,
    },
    selectionProcess: {
      en: {
        type: String,
        default: "",
      },
      hi: {
        type: String,
        default: "",
      },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// advtNo index removed - already has unique: true which creates an index
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ createdAt: -1 });
jobPostingSchema.index({ "post.en": "text", "post.hi": "text", "location.en": "text" });

jobPostingSchema.pre("save", function normalizeHindiMojibake(next) {
  this.title = decodeMojibakeText(this.title);
  this.post.hi = decodeMojibakeText(this.post?.hi);
  this.income.hi = decodeMojibakeText(this.income?.hi);
  this.education.hi = decodeMojibakeText(this.education?.hi);
  this.location.hi = decodeMojibakeText(this.location?.hi);
  this.ageLimit.hi = decodeMojibakeText(this.ageLimit?.hi);
  this.selectionProcess.hi = decodeMojibakeText(this.selectionProcess?.hi);
  this.fee.hi = decodeMojibakeText(this.fee?.hi);
  this.locationArrHi = (this.locationArrHi || []).map((value) =>
    decodeMojibakeText(value),
  );
  next();
});

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);

export default JobPosting;
