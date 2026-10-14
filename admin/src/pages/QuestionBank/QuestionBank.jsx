import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { questionBankAPI } from "../../utils/api";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Copy,
  X,
  Tag,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronUp,
  Star,
  Filter,
  Languages,
  CopyCheck,
} from "lucide-react";

// ─── Static seed data ───────────────────────────────────────────────────────
const INITIAL_QUESTIONS = [
  {
    id: 1,
    question: "What is Newton's Second Law of Motion?",
    questionHi: "न्यूटन का गति का दूसरा नियम क्या है?",
    difficulty: "Medium",
    options: ["F = ma", "F = mv", "F = m/a", "F = ma²"],
    optionsHi: ["F = ma", "F = mv", "F = m/a", "F = ma²"],
    correctAnswer: "F = ma",
    explanation:
      "Newton's second law states that the net force acting on an object equals its mass multiplied by its acceleration (F = ma).",
    explanationHi:
      "न्यूटन के दूसरे नियम के अनुसार किसी वस्तु पर लगने वाला नेट बल उसके द्रव्यमान और त्वरण के गुणनफल के बराबर होता है।",
    tags: ["newton", "force", "acceleration"],
    status: "active",
    usedInPapers: 3,
    createdDate: "2025-06-10",
  },
  {
    id: 2,
    question: "Which of the following is the quadratic formula?",
    questionHi: "निम्नलिखित में से द्विघात सूत्र कौन सा है?",
    difficulty: "Easy",
    options: [
      "x = (-b ± √(b²-4ac)) / 2a",
      "x = (-b ± √(b²+4ac)) / 2a",
      "x = (b ± √(b²-4ac)) / 2a",
      "x = (-b ± √(b²-4ac)) / a",
    ],
    optionsHi: [
      "x = (-b ± √(b²-4ac)) / 2a",
      "x = (-b ± √(b²+4ac)) / 2a",
      "x = (b ± √(b²-4ac)) / 2a",
      "x = (-b ± √(b²-4ac)) / a",
    ],
    correctAnswer: "x = (-b ± √(b²-4ac)) / 2a",
    explanation:
      "The quadratic formula is used to solve ax² + bx + c = 0 and is derived by completing the square.",
    explanationHi:
      "द्विघात सूत्र ax² + bx + c = 0 को हल करने के लिए उपयोग किया जाता है।",
    tags: ["quadratic", "algebra", "equations"],
    status: "active",
    usedInPapers: 5,
    createdDate: "2025-07-01",
  },
  {
    id: 3,
    question: "The process by which plants make food using sunlight is called?",
    questionHi:
      "वह प्रक्रिया जिसके द्वारा पौधे सूर्य के प्रकाश का उपयोग करके भोजन बनाते हैं, कहलाती है?",
    difficulty: "Easy",
    options: ["Photosynthesis", "Respiration", "Transpiration", "Osmosis"],
    optionsHi: ["प्रकाश संश्लेषण", "श्वसन", "वाष्पोत्सर्जन", "परासरण"],
    correctAnswer: "Photosynthesis",
    explanation:
      "Photosynthesis is the process by which green plants use sunlight, water, and CO₂ to produce glucose and oxygen.",
    explanationHi:
      "प्रकाश संश्लेषण वह प्रक्रिया है जिसमें हरे पौधे सूर्य के प्रकाश, जल और CO₂ का उपयोग करके ग्लूकोज और ऑक्सीजन बनाते हैं।",
    tags: ["photosynthesis", "plants", "biology"],
    status: "active",
    usedInPapers: 2,
    createdDate: "2025-08-15",
  },
  {
    id: 4,
    question: "Which data structure uses LIFO (Last In First Out) principle?",
    questionHi:
      "कौन सी डेटा संरचना LIFO (लास्ट इन फर्स्ट आउट) सिद्धांत का उपयोग करती है?",
    difficulty: "Medium",
    options: ["Stack", "Queue", "Array", "Linked List"],
    optionsHi: ["स्टैक", "क्यू", "ऐरे", "लिंक्ड लिस्ट"],
    correctAnswer: "Stack",
    explanation:
      "A Stack follows the LIFO principle where the last element pushed is the first to be popped.",
    explanationHi:
      "स्टैक LIFO सिद्धांत का पालन करता है जिसमें अंतिम में डाला गया तत्व सबसे पहले निकाला जाता है।",
    tags: ["stack", "data structure", "LIFO"],
    status: "draft",
    usedInPapers: 0,
    createdDate: "2025-09-03",
  },
  {
    id: 5,
    question: "What is the chemical formula of water?",
    questionHi: "पानी का रासायनिक सूत्र क्या है?",
    difficulty: "Easy",
    options: ["H₂O", "CO₂", "NaCl", "H₂SO₄"],
    optionsHi: ["H₂O", "CO₂", "NaCl", "H₂SO₄"],
    correctAnswer: "H₂O",
    explanation:
      "Water consists of two hydrogen atoms covalently bonded to one oxygen atom, giving it the formula H₂O.",
    explanationHi:
      "पानी में दो हाइड्रोजन परमाणु एक ऑक्सीजन परमाणु से सहसंयोजक बंधन द्वारा जुड़े होते हैं।",
    tags: ["water", "formula", "chemistry"],
    status: "active",
    usedInPapers: 7,
    createdDate: "2025-05-20",
  },
  {
    id: 6,
    question: "Who wrote the play 'Hamlet'?",
    questionHi: "'हैमलेट' नाटक किसने लिखा?",
    difficulty: "Easy",
    options: [
      "William Shakespeare",
      "Charles Dickens",
      "Jane Austen",
      "John Keats",
    ],
    optionsHi: ["विलियम शेक्सपियर", "चार्ल्स डिकेंस", "जेन ऑस्टन", "जॉन कीट्स"],
    correctAnswer: "William Shakespeare",
    explanation:
      "Hamlet is a tragedy written by William Shakespeare, believed to have been written between 1599 and 1601.",
    explanationHi:
      "हैमलेट विलियम शेक्सपियर द्वारा लिखी गई एक त्रासदी है, जिसे 1599 और 1601 के बीच लिखा गया माना जाता है।",
    tags: ["shakespeare", "hamlet", "literature"],
    status: "active",
    usedInPapers: 1,
    createdDate: "2025-10-11",
  },
  {
    id: 7,
    question: "What is the SI unit of electric current?",
    questionHi: "विद्युत धारा का SI मात्रक क्या है?",
    difficulty: "Easy",
    options: ["Ampere", "Volt", "Ohm", "Watt"],
    optionsHi: ["एम्पीयर", "वोल्ट", "ओम", "वाट"],
    correctAnswer: "Ampere",
    explanation:
      "The SI unit of electric current is Ampere (A), named after André-Marie Ampère.",
    explanationHi:
      "विद्युत धारा का SI मात्रक एम्पीयर (A) है, जिसका नाम आंद्रे-मैरी एम्पीयर के नाम पर रखा गया है।",
    tags: ["electricity", "current", "SI unit"],
    status: "draft",
    usedInPapers: 0,
    createdDate: "2025-11-02",
  },
  {
    id: 8,
    question: "Which sorting algorithm has the best average time complexity?",
    questionHi: "किस सॉर्टिंग एल्गोरिदम की औसत समय जटिलता सबसे अच्छी है?",
    difficulty: "Hard",
    options: [
      "Merge Sort – O(n log n)",
      "Bubble Sort – O(n²)",
      "Selection Sort – O(n²)",
      "Insertion Sort – O(n²)",
    ],
    optionsHi: [
      "मर्ज सॉर्ट – O(n log n)",
      "बबल सॉर्ट – O(n²)",
      "सिलेक्शन सॉर्ट – O(n²)",
      "इन्सर्शन सॉर्ट – O(n²)",
    ],
    correctAnswer: "Merge Sort – O(n log n)",
    explanation:
      "Merge Sort has an average and worst-case time complexity of O(n log n), making it one of the most efficient general-purpose sorting algorithms.",
    explanationHi:
      "मर्ज सॉर्ट की औसत और worst-case समय जटिलता O(n log n) है, जो इसे सबसे कुशल सॉर्टिंग एल्गोरिदम में से एक बनाती है।",
    tags: ["sorting", "merge sort", "algorithms"],
    status: "active",
    usedInPapers: 2,
    createdDate: "2025-12-05",
  },
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

const DIFFICULTY_COLORS = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700",
};

const SUBJECT_OPTIONS = [
  "General Knowledge",
  "Mathematics",
  "Health & Nutrition",
  "Management & Administration",
  "Basic Computer Knowledge",
  "Communication Skills",
  "Other",
];

const EMPTY_FORM = {
  question: "",
  questionHi: "",
  subject: "General Knowledge",
  difficulty: "",
  options: [], // English options
  optionsHi: [], // Hindi options (parallel array)
  correctAnswer: "",
  explanation: "",
  explanationHi: "",
  tags: "",
};

let nextId = INITIAL_QUESTIONS.length + 1;
const uid = () => nextId++;

const normalizeQuestion = (q) => ({
  ...q,
  id: q?._id || q?.id || uid(),
  question: String(q?.question || ""),
  questionHi: String(q?.questionHi || ""),
  subject: String(q?.subject || "General Knowledge"),
  difficulty: String(q?.difficulty || ""),
  options: Array.isArray(q?.options) ? q.options : [],
  optionsHi: Array.isArray(q?.optionsHi) ? q.optionsHi : [],
  correctAnswer: String(q?.correctAnswer || ""),
  explanation: String(q?.explanation || ""),
  explanationHi: String(q?.explanationHi || ""),
  tags: Array.isArray(q?.tags) ? q.tags : [],
  status: q?.status === "active" ? "active" : "draft",
  usedInPapers: Number(q?.usedInPapers || 0),
  createdDate: q?.createdDate || q?.createdAt || new Date().toISOString(),
});

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Local input state
  const [searchQuery, setSearchQuery] = useState(""); // Actual search query for API
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const limit = 20;

  // Option inputs for form
  const [optionInputEn, setOptionInputEn] = useState("");
  const [optionInputHi, setOptionInputHi] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await questionBankAPI.getAll({
        page: currentPage,
        limit: limit,
        search: searchQuery,
        subject: filterSubject,
        status: filterStatus,
      });

      if (!response?.success) {
        setApiError(response?.error || "Failed to load questions.");
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      const rows = Array.isArray(response?.data?.questions)
        ? response.data.questions
        : [];
      setQuestions(rows.map(normalizeQuestion));
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages || 1);
        setTotalQuestions(response.data.pagination.total || 0);
      }
    } catch (err) {
      setApiError("An error occurred while fetching questions.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filterSubject, filterStatus]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSubject, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Note: Stats here are based on the current page's data or we can fetch overall stats if needed.
    // For now, let's keep it simple or use the totalQuestions from pagination for "Total".
    return [
      {
        label: "Total Questions",
        value: totalQuestions,
        icon: BookOpen,
        border: "border-[#3AB000]",
        iconBg: "bg-[#e8f5e2]",
        iconColor: "text-[#3AB000]",
      },
      {
        label: "Active",
        value: questions.filter((q) => q.status === "active").length, // Page-specific
        icon: CheckCircle,
        border: "border-emerald-500",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        label: "Draft",
        value: questions.filter((q) => q.status === "draft").length, // Page-specific
        icon: Star,
        border: "border-amber-500",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
    ];
  }, [questions, totalQuestions]);

  const isFiltered =
    searchQuery ||
    filterSubject !== "all" ||
    filterStatus !== "all";

  // ── Form helpers ───────────────────────────────────────────────────────────
  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // "Same in Both" for question field
  const copyQuestionToHindi = () => {
    setFormData((prev) => ({ ...prev, questionHi: prev.question }));
  };

  // "Same in Both" for explanation field
  const copyExplanationToHindi = () => {
    setFormData((prev) => ({ ...prev, explanationHi: prev.explanation }));
  };

  // "Same in Both" for a specific option input
  const copyOptionToHindi = () => {
    setOptionInputHi(optionInputEn);
  };

  const addOption = () => {
    if (!optionInputEn.trim()) return;
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, optionInputEn.trim()],
      optionsHi: [
        ...prev.optionsHi,
        optionInputHi.trim() || optionInputEn.trim(),
      ],
    }));
    setOptionInputEn("");
    setOptionInputHi("");
  };

  const removeOption = (idx) => {
    setFormData((prev) => {
      const nextOptions = prev.options.filter((_, i) => i !== idx);
      const nextOptionsHi = prev.optionsHi.filter((_, i) => i !== idx);
      return {
        ...prev,
        options: nextOptions,
        optionsHi: nextOptionsHi,
        correctAnswer: nextOptions.includes(prev.correctAnswer)
          ? prev.correctAnswer
          : "",
      };
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setFormData(EMPTY_FORM);
    setOptionInputEn("");
    setOptionInputHi("");
  };

  const openCreate = () => {
    setEditingQuestion(null);
    setFormData(EMPTY_FORM);
    setOptionInputEn("");
    setOptionInputHi("");
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question || "",
      questionHi: q.questionHi || "",
      subject: q.subject || "General Knowledge",
      difficulty: q.difficulty || "",
      options: Array.isArray(q.options) ? [...q.options] : [],
      optionsHi: Array.isArray(q.optionsHi) ? [...q.optionsHi] : [],
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
      explanationHi: q.explanationHi || "",
      tags: Array.isArray(q.tags) ? q.tags.join(", ") : "",
    });
    setOptionInputEn("");
    setOptionInputHi("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (
      !formData.question ||
      !formData.subject ||
      !formData.difficulty
    )
      return "Please fill in all required fields.";
    if (formData.options.length < 2) return "Add at least 2 options for MCQ.";
    if (!formData.correctAnswer) return "Select correct answer.";
    if (!formData.options.includes(formData.correctAnswer))
      return "Correct answer must match one of the options.";
    return "";
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    const payload = {
      question: formData.question.trim(),
      questionHi: formData.questionHi.trim(),
      subject: formData.subject,
      difficulty: formData.difficulty,
      options: formData.options,
      optionsHi:
        formData.optionsHi.length === formData.options.length
          ? formData.optionsHi
          : formData.options, // fallback to English if Hindi not filled
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation.trim(),
      explanationHi: formData.explanationHi.trim(),
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      status: editingQuestion?.status || "draft",
      usedInPapers: 0,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    const response = editingQuestion
      ? await questionBankAPI.update(editingQuestion.id, payload)
      : await questionBankAPI.create(payload);
    if (!response?.success) {
      alert(response?.error || "Failed to save question.");
      return;
    }

    await loadQuestions();
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    const response = await questionBankAPI.delete(id);
    if (!response?.success) {
      alert(response?.error || "Failed to delete question.");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const handleDuplicate = async (q) => {
    const payload = {
      question: `${q.question} (Copy)`,
      questionHi: q.questionHi ? `${q.questionHi} (प्रति)` : "",
      subject: q.subject || "General Knowledge",
      difficulty: q.difficulty || "Easy",
      options: Array.isArray(q.options) ? q.options : [],
      optionsHi: Array.isArray(q.optionsHi) ? q.optionsHi : [],
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
      explanationHi: q.explanationHi || "",
      tags: Array.isArray(q.tags) ? q.tags : [],
      status: "draft",
      usedInPapers: 0,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    const response = await questionBankAPI.create(payload);
    if (!response?.success) {
      alert(response?.error || "Failed to duplicate question.");
      return;
    }
    await loadQuestions();
  };

  const toggleStatus = async (q) => {
    const next = q.status === "active" ? "draft" : "active";
    const response = await questionBankAPI.update(q.id, { status: next });
    if (!response?.success) {
      alert(response?.error || "Failed to update status.");
      return;
    }
    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, status: next } : item)),
    );
  };

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));
  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected question(s)?`))
      return;

    const results = await Promise.all(
      selectedIds.map((id) => questionBankAPI.delete(id)),
    );
    const failed = results.find((r) => !r?.success);
    if (failed) {
      alert(failed?.error || "Some questions could not be deleted.");
      return;
    }

    setQuestions((prev) => prev.filter((q) => !selectedIds.includes(q.id)));
    setSelectedIds([]);
  };

  const inputCls =
    "w-full px-4 py-3 border-2 border-gray-200 rounded-sm text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] bg-white";

  // ── "Same in Both" Button ──────────────────────────────────────────────────
  const SameInBothBtn = ({ onClick, label = "Same in Both" }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 text-xs font-semibold rounded-sm transition-colors"
      title="Copy English text to Hindi"
    >
      <CopyCheck size={13} />
      {label}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 ml-6 p-0">
        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`bg-white rounded-sm shadow-md p-6 border-l-4 ${stat.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-semibold uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-sm`}>
                    <Icon className={stat.iconColor} size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search / Filter / Actions ── */}
        <div className="bg-white rounded-sm shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
              {/* Search */}
              <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[500px]">
                <Search
                  className="ml-3 text-gray-400 flex-shrink-0"
                  size={18}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchInput)}
                  placeholder="Search questions, topics, tags..."
                  className="flex-1 px-3 text-sm text-gray-700 focus:outline-none h-full bg-white"
                />
                <button 
                  onClick={() => setSearchQuery(searchInput)}
                  className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-sm px-5 h-full font-medium transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-rose-400 text-rose-600 rounded-sm text-sm font-bold hover:bg-rose-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={15} /> Delete ({selectedIds.length})
                </button>
              )}
              <button
                onClick={openCreate}
                className="flex-1 sm:flex-none bg-black hover:bg-[#3AB000] text-white text-sm font-medium px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add MCQ
              </button>
            </div>
          </div>

          {/* Second row */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0 border border-gray-300 rounded overflow-hidden flex-shrink-0">
              {["all", "active", "draft"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-5 py-2 text-xs font-medium border-r border-gray-300 last:border-r-0 transition-colors whitespace-nowrap ${
                    filterStatus === tab
                      ? "bg-[#3AB000] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="border border-gray-300 rounded h-9 px-3 text-sm text-gray-700 focus:outline-none bg-white"
            >
              <option value="all">All Subjects</option>
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {isFiltered && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setFilterSubject("all");
                  setFilterStatus("all");
                }}
                className="px-4 py-2 text-[#3AB000] font-semibold text-sm hover:underline transition-colors"
              >
                Clear Filters
              </button>
            )}

            <span className="ml-auto text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {questions.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {totalQuestions}
              </span>{" "}
              questions
            </span>
          </div>
        </div>

        {/* ── Question Cards ── */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-sm shadow-md p-12 text-center text-gray-600">
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-sm shadow-md p-12 text-center">
              <div className="bg-gray-100 w-20 h-20 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Filter className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Questions Found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or add a new MCQ.
              </p>
              <button
                onClick={openCreate}
                className="px-6 py-2 bg-[#3AB000] text-white rounded-sm font-bold text-sm hover:bg-[#2d8a00] transition shadow-md inline-flex items-center gap-2"
              >
                <Plus size={16} /> Add MCQ
              </button>
            </div>
          ) : (
            questions.map((q) => {
              const isExpanded = expandedId === q.id;
              const isSelected = selectedIds.includes(q.id);
              const tags = Array.isArray(q.tags) ? q.tags : [];
              const options = Array.isArray(q.options) ? q.options : [];
              const optionsHi = Array.isArray(q.optionsHi) ? q.optionsHi : [];

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-sm shadow-md overflow-hidden transition-all ${
                    isSelected
                      ? "border-l-4 border-[#3AB000]"
                      : "border-l-4 border-transparent hover:border-[#a8e08a]"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                        className="mt-1 w-4 h-4 cursor-pointer flex-shrink-0 accent-[#3AB000]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Badge row */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700">
                                MCQ
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-purple-100 text-purple-700">
                                {q.subject}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${DIFFICULTY_COLORS[q.difficulty] || "bg-gray-100 text-gray-600"}`}
                              >
                                {q.difficulty}
                              </span>
                              {/* Hindi badge */}
                              {q.questionHi && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-orange-100 text-orange-700 flex items-center gap-1">
                                  <Languages size={10} /> द्विभाषी
                                </span>
                              )}
                              <button
                                onClick={() => toggleStatus(q)}
                                className={`text-xs font-semibold px-3 py-0.5 rounded-sm transition-colors ${
                                  q.status === "active"
                                    ? "bg-[#e8f5e2] text-[#3AB000] hover:bg-[#d0edcc]"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                }`}
                              >
                                {q.status === "active" ? "● Active" : "○ Draft"}
                              </button>
                            </div>

                            {/* Question text */}
                            <p className="text-gray-900 font-semibold text-sm leading-relaxed">
                              {q.question}
                            </p>
                            {q.questionHi && (
                              <p className="text-orange-800 font-medium text-sm leading-relaxed mt-1">
                                {q.questionHi}
                              </p>
                            )}

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <BarChart3 size={12} />
                                Used in {Number(q.usedInPapers || 0)} paper
                                {Number(q.usedInPapers || 0) !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(q.createdDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>

                            {/* Tags */}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tags.map((tag, i) => (
                                  <span
                                    key={`${q.id}-${i}`}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm flex items-center gap-1"
                                  >
                                    <Tag size={10} />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleExpand(q.id)}
                              className="p-2 hover:bg-gray-100 rounded-sm transition-colors text-gray-500"
                              title="Expand"
                            >
                              {isExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => openEdit(q)}
                              className="p-2 hover:bg-[#e8f5e2] rounded-sm transition-colors text-[#3AB000]"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDelete(q.id)}
                              className="p-2 hover:bg-rose-100 rounded-sm transition-colors text-rose-600"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#f4fbf0] p-6 space-y-5">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                          Options
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {options.map((opt, i) => (
                            <div
                              key={`${q.id}-opt-${i}`}
                              className={`px-4 py-3 rounded-sm text-sm border shadow-sm ${
                                opt === q.correctAnswer
                                  ? "bg-[#e8f5e2] border-[#3AB000] text-[#2d8a00] font-semibold"
                                  : "bg-white border-gray-200 text-gray-700"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {opt === q.correctAnswer ? (
                                  <CheckCircle
                                    size={16}
                                    className="text-[#3AB000] flex-shrink-0 mt-0.5"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <div className="font-medium">{opt}</div>
                                  {optionsHi[i] && (
                                    <div className="text-orange-700 text-xs mt-0.5">
                                      {optionsHi[i]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      {(q.explanation || q.explanationHi) && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Explanation
                          </p>
                          <div className="bg-[#e8f5e2] border border-[#3AB000] rounded-sm px-4 py-3 shadow-sm space-y-1">
                            {q.explanation && (
                              <p className="text-sm text-[#2d8a00]">
                                {q.explanation}
                              </p>
                            )}
                            {q.explanationHi && (
                              <p
                                className={`text-sm text-orange-800 ${q.explanation ? "border-t border-[#3AB000] pt-1 mt-1" : ""}`}
                              >
                                {q.explanationHi}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-sm p-3 text-sm">
              {apiError}
            </div>
          )}
        </div>

        {/* ── Footer / Pagination ── */}
        {questions.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-sm shadow-md p-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold text-gray-900">{questions.length}</span> of <span className="font-semibold text-gray-900">{totalQuestions}</span> questions
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show only first, last, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-bold transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#3AB000] text-white"
                            : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>

            <div className="text-gray-500 text-xs hidden lg:block">
              Click a card to expand options &amp; explanation
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            Add / Edit Modal
        ══════════════════════════════════════════════════════ */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-[#3AB000] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Languages size={18} />
                  {editingQuestion ? "Edit MCQ" : "Add New MCQ"}
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-sm font-normal">
                    EN + हिंदी
                  </span>
                </h3>
                <button
                  onClick={closeModal}
                  className="hover:bg-[#2d8a00] p-1 rounded-sm transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* ── Question (EN + HI) ── */}
                <div className="border-2 border-gray-100 rounded-sm p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Question <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  {/* English */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        EN
                      </span>
                      <span className="text-xs text-gray-500">English</span>
                    </div>
                    <textarea
                      name="question"
                      value={formData.question}
                      onChange={handleInput}
                      rows={2}
                      placeholder="Enter question in English..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-sm text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] resize-none"
                    />
                  </div>

                  {/* Same in Both */}
                  <div className="flex justify-center">
                    <SameInBothBtn
                      onClick={copyQuestionToHindi}
                      label="Same in Both / दोनों में समान"
                    />
                  </div>

                  {/* Hindi */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                        HI
                      </span>
                      <span className="text-xs text-gray-500">हिंदी</span>
                    </div>
                    <textarea
                      name="questionHi"
                      value={formData.questionHi}
                      onChange={handleInput}
                      rows={2}
                      placeholder="प्रश्न हिंदी में लिखें..."
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-sm text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                    />
                  </div>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Subject / विषय <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInput}
                    className={inputCls}
                  >
                    <option value="">Select Subject / विषय चुनें</option>
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Difficulty / कठिनाई <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInput}
                    className={inputCls}
                  >
                    <option value="">Select Difficulty / कठिनाई चुनें</option>
                    {DIFFICULTY_LEVELS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── Options ── */}
                <div className="border-2 border-gray-100 rounded-sm p-4 bg-gray-50">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                    Options <span className="text-rose-500">*</span>
                  </label>

                  {/* Input row: EN + Same + HI + Add */}
                  <div className="space-y-2 mb-3">
                    {/* English option input */}
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded flex-shrink-0">
                        EN
                      </span>
                      <input
                        value={optionInputEn}
                        onChange={(e) => setOptionInputEn(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                        placeholder="Type option in English..."
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-sm text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000]"
                      />
                    </div>

                    {/* Same in Both button */}
                    <div className="flex justify-center">
                      <SameInBothBtn
                        onClick={copyOptionToHindi}
                        label="Same in Both / दोनों में समान"
                      />
                    </div>

                    {/* Hindi option input */}
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded flex-shrink-0">
                        HI
                      </span>
                      <input
                        value={optionInputHi}
                        onChange={(e) => setOptionInputHi(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                        placeholder="हिंदी में विकल्प लिखें..."
                        className="flex-1 px-4 py-2.5 border-2 border-orange-200 rounded-sm text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                      />
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      onClick={addOption}
                      className="w-full py-2.5 bg-[#3AB000] text-white rounded-sm text-sm font-bold hover:bg-[#2d8a00] transition shadow-md flex items-center justify-center gap-2"
                    >
                      <Plus size={15} /> Add Option
                    </button>
                  </div>

                  {/* Added options list */}
                  <div className="space-y-2">
                    {formData.options.map((opt, i) => (
                      <div
                        key={`form-opt-${i}`}
                        className="flex items-start justify-between bg-white px-4 py-2.5 rounded-sm border-2 border-gray-200 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              EN
                            </span>
                            <span className="text-sm text-gray-700">{opt}</span>
                          </div>
                          {formData.optionsHi[i] && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                                HI
                              </span>
                              <span className="text-sm text-orange-800">
                                {formData.optionsHi[i]}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeOption(i)}
                          className="text-rose-500 hover:text-rose-700 transition-colors flex-shrink-0 mt-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Correct Answer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleInput}
                    className={inputCls}
                  >
                    <option value="">Select Correct Answer</option>
                    {formData.options.map((opt, i) => (
                      <option key={`correct-${i}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── Explanation (EN + HI) ── */}
                <div className="border-2 border-gray-100 rounded-sm p-4 bg-gray-50 space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Explanation
                  </label>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        EN
                      </span>
                    </div>
                    <textarea
                      name="explanation"
                      value={formData.explanation}
                      onChange={handleInput}
                      rows={2}
                      placeholder="Optional explanation in English..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-sm text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] resize-none"
                    />
                  </div>

                  <div className="flex justify-center">
                    <SameInBothBtn
                      onClick={copyExplanationToHindi}
                      label="Same in Both / दोनों में समान"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                        HI
                      </span>
                    </div>
                    <textarea
                      name="explanationHi"
                      value={formData.explanationHi}
                      onChange={handleInput}
                      rows={2}
                      placeholder="हिंदी में स्पष्टीकरण लिखें..."
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-sm text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Tags{" "}
                    <span className="text-gray-400 font-normal normal-case">
                      (comma separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInput}
                    placeholder="e.g. algebra, equations, class10"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 border-2 border-gray-200 rounded-sm text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-[#3AB000] text-white rounded-sm text-sm font-bold hover:bg-[#2d8a00] transition shadow-md"
                >
                  {editingQuestion ? "Update MCQ" : "Save MCQ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
