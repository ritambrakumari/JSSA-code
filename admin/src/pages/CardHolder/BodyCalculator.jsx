import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { calculatorAPI } from "../../utils/api";
import { 
  Calculator, 
  History, 
  Scale, 
  Flame, 
  Footprints, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  User,
  Activity
} from "lucide-react";
import { toast } from "react-hot-toast";

const BodyCalculator = () => {
  const [activeTab, setActiveTab] = useState("calculators");
  const [activeCalc, setActiveCalc] = useState("BMI");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activity: "1.2",
    goal: "maintain",
    stepGoal: "general"
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await calculatorAPI.getMyHistory();
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setResult(null); // Reset result on change
  };

  const calculateBMI = async () => {
    const { weight, height } = formData;
    if (!weight || !height) return toast.error("Please enter weight and height");

    setCalculating(true);
    const hMeter = height / 100;
    const bmi = (weight / (hMeter * hMeter)).toFixed(1);
    
    let category = "";
    let color = "";
    if (bmi < 18.5) { category = "Underweight"; color = "text-blue-500"; }
    else if (bmi < 25) { category = "Normal"; color = "text-green-600"; }
    else if (bmi < 30) { category = "Overweight"; color = "text-orange-500"; }
    else { category = "Obese"; color = "text-red-600"; }

    const resObj = { bmi, category, color };
    setResult(resObj);

    // Log to backend
    await calculatorAPI.log({
      calculatorType: "BMI",
      inputs: { weight, height },
      result: resObj
    });
    setCalculating(false);
  };

  const calculateDailyCalorie = async () => {
    const { weight, height, age, gender, activity, goal } = formData;
    if (!weight || !height || !age) return toast.error("Please fill all fields");

    setCalculating(true);
    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === "male") bmr += 5;
    else bmr -= 161;

    const tdee = Math.round(bmr * parseFloat(activity));
    let target = tdee;
    
    // Detailed Goal Logic
    if (goal === "mild_loss") target -= 250;
    else if (goal === "loss") target -= 500;
    else if (goal === "extreme_loss") target -= 1000;
    else if (goal === "mild_gain") target += 250;
    else if (goal === "gain") target += 500;
    else if (goal === "extreme_gain") target += 1000;

    const resObj = { bmr: Math.round(bmr), tdee, target, goal };
    setResult(resObj);

    await calculatorAPI.log({
      calculatorType: "DailyCalorie",
      inputs: { weight, height, age, gender, activity, goal },
      result: resObj
    });
    setCalculating(false);
  };

  const calculateIdealWeight = async () => {
    const { height, gender } = formData;
    if (!height) return toast.error("Please enter height");

    setCalculating(true);
    const heightInches = height / 2.54;
    const baseHeight = 60; // 5 feet
    const extraInches = Math.max(0, heightInches - baseHeight);

    let ideal = 0;
    if (gender === "male") ideal = 50 + (2.3 * extraInches);
    else ideal = 45.5 + (2.3 * extraInches);

    const rangeMin = (ideal * 0.9).toFixed(1);
    const rangeMax = (ideal * 1.1).toFixed(1);

    const resObj = { ideal: ideal.toFixed(1), range: `${rangeMin} - ${rangeMax} kg` };
    setResult(resObj);

    await calculatorAPI.log({
      calculatorType: "IdealWeight",
      inputs: { height, gender },
      result: resObj
    });
    setCalculating(false);
  };

  const calculateStepGoal = async () => {
    const { stepGoal } = formData;
    
    setCalculating(true);
    let target = 0;
    let label = "";
    if (stepGoal === "sedentary") { target = 5000; label = "Minimum Activity"; }
    else if (stepGoal === "general") { target = 7500; label = "General Fitness"; }
    else if (stepGoal === "loss") { target = 10000; label = "Active / Weight Loss"; }
    else if (stepGoal === "high") { target = 12500; label = "Very Active"; }
    else if (stepGoal === "athlete") { target = 15000; label = "Athlete / Maximum"; }

    const approxBurn = Math.round(target * 0.04);
    const resObj = { target, label, approxBurn };
    setResult(resObj);

    await calculatorAPI.log({
      calculatorType: "StepGoal",
      inputs: { stepGoal },
      result: resObj
    });
    setCalculating(false);
  };

  const calculators = [
    { id: "BMI", name: "BMI Calculator", icon: Scale, action: calculateBMI },
    { id: "DailyCalorie", name: "Daily Calories", icon: Flame, action: calculateDailyCalorie },
    { id: "IdealWeight", name: "Ideal Weight", icon: User, action: calculateIdealWeight },
    { id: "StepGoal", name: "Step Goal", icon: Footprints, action: calculateStepGoal },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Health Calculators</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Monitor your fitness metrics</p>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-none flex gap-3 items-start">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1">Medical Disclaimer</p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              These calculators are for educational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-none">
          <button 
            onClick={() => setActiveTab("calculators")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "calculators" ? "bg-white text-[#3AB000] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Calculator size={16} /> Calculators
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "history" ? "bg-white text-[#3AB000] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <History size={16} /> My History
          </button>
        </div>

        {activeTab === "calculators" ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar List */}
            <div className="w-full lg:w-72 space-y-2">
              {calculators.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => { setActiveCalc(calc.id); setResult(null); }}
                  className={`w-full flex items-center justify-between p-4 text-left transition-all rounded-none border-b-2 ${activeCalc === calc.id ? "bg-[#3AB000] text-white border-[#2d8a00]" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <calc.icon size={20} className={activeCalc === calc.id ? "text-white" : "text-[#3AB000]"} />
                    <span className="text-sm font-black uppercase tracking-tight">{calc.name}</span>
                  </div>
                  <ChevronRight size={16} opacity={activeCalc === calc.id ? 1 : 0.3} />
                </button>
              ))}
            </div>

            {/* Calculator Interface */}
            <div className="flex-1 bg-white border border-gray-100 shadow-xl p-6 md:p-8 rounded-none relative">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-green-50 text-[#3AB000]">
                    {React.createElement(calculators.find(c => c.id === activeCalc)?.icon || Calculator, { size: 24 })}
                  </div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{calculators.find(c => c.id === activeCalc)?.name}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inputs based on activeCalc */}
                  <div className="space-y-4">
                    {(activeCalc === "BMI" || activeCalc === "DailyCalorie" || activeCalc === "IdealWeight") && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Height (cm)</label>
                        <input 
                          type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="e.g. 175"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold"
                        />
                      </div>
                    )}
                    {(activeCalc === "BMI" || activeCalc === "DailyCalorie") && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Weight (kg)</label>
                        <input 
                          type="number" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="e.g. 70"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold"
                        />
                      </div>
                    )}
                    {activeCalc === "DailyCalorie" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Age (years)</label>
                        <input 
                          type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="e.g. 25"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold"
                        />
                      </div>
                    )}
                    {(activeCalc === "DailyCalorie" || activeCalc === "IdealWeight") && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Gender</label>
                        <select 
                          name="gender" value={formData.gender} onChange={handleInputChange}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold uppercase text-xs"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    )}
                    {activeCalc === "DailyCalorie" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Activity Level</label>
                          <select 
                            name="activity" value={formData.activity} onChange={handleInputChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold uppercase text-[11px]"
                          >
                            <option value="1.2">Sedentary (Little/No Exercise)</option>
                            <option value="1.375">Lightly Active (Exercise 1-3 days/week)</option>
                            <option value="1.55">Moderately Active (Exercise 3-5 days/week)</option>
                            <option value="1.725">Very Active (Hard exercise 6-7 days/week)</option>
                            <option value="1.9">Extra Active (Very hard exercise/Physical job)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Weight Goal</label>
                          <select 
                            name="goal" value={formData.goal} onChange={handleInputChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold uppercase text-[11px]"
                          >
                            <option value="maintain">Maintain Weight</option>
                            <option value="mild_loss">Mild Weight Loss (0.25 kg/week)</option>
                            <option value="loss">Weight Loss (0.5 kg/week)</option>
                            <option value="extreme_loss">Extreme Weight Loss (1 kg/week)</option>
                            <option value="mild_gain">Mild Weight Gain (0.25 kg/week)</option>
                            <option value="gain">Weight Gain (0.5 kg/week)</option>
                            <option value="extreme_gain">Extreme Weight Gain (1 kg/week)</option>
                          </select>
                        </div>
                      </>
                    )}
                    {activeCalc === "StepGoal" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fitness Focus</label>
                        <select 
                          name="stepGoal" value={formData.stepGoal} onChange={handleInputChange}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-[#3AB000] font-bold uppercase text-[11px]"
                        >
                          <option value="sedentary">Minimum Activity (5,000 Steps)</option>
                          <option value="general">General Health Baseline (7,500 Steps)</option>
                          <option value="loss">Active / Weight Loss Focus (10,000 Steps)</option>
                          <option value="high">High Intensity Fitness (12,500 Steps)</option>
                          <option value="athlete">Athlete / Maximum Performance (15,000 Steps)</option>
                        </select>
                      </div>
                    )}

                    <button 
                      onClick={calculators.find(c => c.id === activeCalc)?.action}
                      disabled={calculating}
                      className="w-full bg-[#3AB000] text-white p-4 font-black uppercase tracking-widest hover:bg-[#2d8a00] transition-colors shadow-lg mt-6 flex items-center justify-center gap-2"
                    >
                      {calculating ? "Processing..." : "Calculate Result"}
                      {!calculating && <Activity size={18} />}
                    </button>
                  </div>

                  {/* Result Display */}
                  <div className={`border-2 p-6 flex flex-col items-center justify-center text-center rounded-none transition-all ${result ? "bg-green-50 border-[#3AB000]" : "bg-gray-50 border-dashed border-gray-200"}`}>
                    {!result ? (
                      <div className="opacity-40 flex flex-col items-center">
                        <Calculator size={48} className="mb-3 text-gray-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Enter details to see results</p>
                      </div>
                    ) : (
                      <div className="w-full animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={32} className="text-[#3AB000] mb-4 mx-auto" />
                        
                        {activeCalc === "BMI" && (
                          <>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your BMI</p>
                            <h3 className="text-4xl font-black text-gray-900 mb-2">{result.bmi}</h3>
                            <div className={`inline-block px-4 py-1 font-black uppercase text-xs tracking-tighter bg-white border mb-6 ${result.color}`}>
                              {result.category}
                            </div>

                            {/* BMI Explanation Table */}
                            <div className="w-full mt-4 text-left border border-gray-100 bg-white p-3">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">Understanding your BMI</p>
                              <div className="space-y-1.5">
                                {[
                                  { label: "Underweight", range: "< 18.5", color: "bg-blue-500" },
                                  { label: "Normal", range: "18.5 - 24.9", color: "bg-green-600" },
                                  { label: "Overweight", range: "25 - 29.9", color: "bg-orange-500" },
                                  { label: "Obese", range: "≥ 30", color: "bg-red-600" }
                                ].map((row) => (
                                  <div key={row.label} className={`flex items-center justify-between px-2 py-1 ${result.category === row.label ? "bg-gray-50 ring-1 ring-inset ring-gray-200" : "opacity-60"}`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${row.color}`}></div>
                                      <span className={`text-[10px] font-black uppercase ${result.category === row.label ? "text-gray-900" : "text-gray-500"}`}>{row.label}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">{row.range}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {activeCalc === "DailyCalorie" && (
                          <>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Calories</p>
                            <h3 className="text-4xl font-black text-[#3AB000] mb-2">{result.target} <span className="text-sm">kcal</span></h3>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Maintenance: {result.tdee} kcal</p>
                            <div className="mt-4 p-3 bg-white border border-green-100 text-[11px] font-bold text-gray-600 uppercase tracking-tighter">
                               Goal: {result.goal === "loss" ? "Weight Loss" : result.goal === "gain" ? "Weight Gain" : "Maintain"}
                            </div>
                          </>
                        )}

                        {activeCalc === "IdealWeight" && (
                          <>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ideal Weight</p>
                            <h3 className="text-4xl font-black text-[#3AB000] mb-2">{result.ideal} <span className="text-sm">kg</span></h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Healthy Range</p>
                            <p className="text-sm font-black text-gray-700">{result.range}</p>
                          </>
                        )}

                        {activeCalc === "StepGoal" && (
                          <>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{result.label}</p>
                            <h3 className="text-4xl font-black text-[#3AB000] mb-2">{result.target.toLocaleString()} <span className="text-sm text-gray-400">steps</span></h3>
                            <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
                               <Flame size={16} className="text-orange-500" />
                               <span className="text-xs font-bold uppercase tracking-widest">~{result.approxBurn} kcal burned</span>
                            </div>
                          </>
                        )}

                        <div className="mt-8 pt-6 border-t border-green-200">
                           <p className="text-[9px] italic text-gray-400 leading-tight">Calculation saved to your history for tracking.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 shadow-xl p-0 rounded-none overflow-hidden">
            {loadingHistory ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                 <div className="w-8 h-8 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Retrieving Logs...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-4 opacity-50">
                 <History size={48} className="text-gray-300" />
                 <p className="text-sm font-black uppercase tracking-widest text-gray-400">No calculation records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em]">Date</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em]">Calculator</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em]">Inputs Provided</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em]">Result Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((log) => (
                      <tr key={log._id} className="border-b border-gray-100 hover:bg-green-50/30 transition-colors">
                        <td className="p-4">
                           <div className="text-[11px] font-black text-gray-900">
                             {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </div>
                           <div className="text-[9px] font-bold text-gray-400 uppercase">{new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#3AB000]"></span>
                              <span className="text-xs font-black uppercase text-gray-700 tracking-tight">{log.calculatorType}</span>
                           </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-gray-600">
                           {Object.entries(log.inputs).map(([key, val]) => (
                             <span key={key} className="inline-block mr-3 bg-gray-100 px-2 py-0.5 text-[9px] uppercase font-bold text-gray-500">
                               {key}: {val}
                             </span>
                           ))}
                        </td>
                        <td className="p-4">
                           {log.calculatorType === "BMI" && (
                             <span className="text-sm font-black text-gray-900">{log.result.bmi} <span className="text-[10px] uppercase text-gray-400 ml-1">({log.result.category})</span></span>
                           )}
                           {log.calculatorType === "DailyCalorie" && (
                             <span className="text-sm font-black text-[#3AB000]">{log.result.target} <span className="text-[10px] uppercase text-gray-400 ml-1">kcal</span></span>
                           )}
                           {log.calculatorType === "IdealWeight" && (
                             <span className="text-sm font-black text-gray-900">{log.result.ideal} <span className="text-[10px] uppercase text-gray-400 ml-1">kg</span></span>
                           )}
                           {log.calculatorType === "StepGoal" && (
                             <span className="text-sm font-black text-gray-900">{log.result.target.toLocaleString()} <span className="text-[10px] uppercase text-gray-400 ml-1">steps</span></span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-gray-50 border border-gray-100 text-center">
           <div className="flex items-center justify-center gap-2 text-[#3AB000] mb-2">
              <Info size={16} />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Health Insights</p>
           </div>
           <p className="text-[11px] text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
             Consistent monitoring of these basic metrics can help in maintaining a balanced lifestyle. 
             Combine these insights with a healthy diet and regular physical activity for the best results.
             For accurate clinical assessment, please consult a registered medical practitioner.
           </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BodyCalculator;
