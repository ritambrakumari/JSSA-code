import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmacyBillsAPI, pharmacyProductsAPI, pharmaciesAPI } from "../../utils/api";
import { Search, Plus, Trash2, Save, Printer, User, FileText, ArrowLeft, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";

const CreatePharmacyBill = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prescription = location.state?.prescription;
  const billRef = useRef();
  
  const [mobile, setMobile] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isCardHolder, setIsCardHolder] = useState(false);
  const [cardId, setCardId] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [searching, setSearching] = useState(false);

  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [items, setItems] = useState([]);

  const [saving, setSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [shopName, setShopName] = useState("PHARMACY INVOICE");
  const [pharmacyDetails, setPharmacyDetails] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchPharmacyProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (prescription) {
      if (prescription.cardholderId?.phone && !mobile) {
        setMobile(prescription.cardholderId.phone);
      }
      if (prescription.cardholderId?.name && !customerName) {
        setCustomerName(prescription.cardholderId.name);
      }
      
      if (products.length > 0 && items.length === 0) {
        const autoItems = [];
        prescription.medicines?.forEach(med => {
          const matchedProduct = products.find(p => p._id === med.medicineId?._id || p.name.toLowerCase() === med.name.toLowerCase());
          if (matchedProduct && matchedProduct.stock > 0) {
            let qty = 1;
            try {
              const daysMatch = med.duration.match(/(\d+)/);
              const days = daysMatch ? parseInt(daysMatch[1]) : 1;
              const freqParts = med.frequency ? med.frequency.split("-") : [];
              let perDay = 0;
              if (freqParts.length === 3) {
                 perDay = parseInt(freqParts[0]||0) + parseInt(freqParts[1]||0) + parseInt(freqParts[2]||0);
              } else {
                 perDay = 1;
              }
              qty = days * (perDay > 0 ? perDay : 1);
            } catch(e) {}

            if (qty > matchedProduct.stock) qty = matchedProduct.stock;
            if (qty < 1) qty = 1;

            autoItems.push({
              product: matchedProduct._id,
              name: matchedProduct.name,
              price: matchedProduct.price,
              quantity: qty,
              total: matchedProduct.price * qty
            });
          }
        });
        if (autoItems.length > 0) {
          setItems(autoItems);
        }
      }
    }
  }, [prescription, products]);

  useEffect(() => {
    if (mobile.length === 10) {
      const timer = setTimeout(() => {
        verifyMobile(mobile);
      }, 500);
      return () => clearTimeout(timer);
    } else if (mobile.length > 0 && mobile.length < 10) {
      setIsCardHolder(false);
      setCustomerName("");
      setCardId(null);
      setDiscountPercent(0);
    }
  }, [mobile]);

  const fetchPharmacyProfile = async () => {
    try {
      const res = await pharmaciesAPI.getProfile();
      if (res.success && res.pharmacy) {
        setShopName(res.pharmacy.shopName || res.pharmacy.name || "PHARMACY INVOICE");
        setPharmacyDetails(res.pharmacy);
      }
    } catch (error) {
      console.error("Failed to fetch pharmacy profile", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await pharmacyProductsAPI.getAll();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  const verifyMobile = async (mobileToVerify) => {
    if (!mobileToVerify || mobileToVerify.length !== 10) {
      return;
    }
    setSearching(true);
    try {
      const res = await pharmacyBillsAPI.verifyCardholder(mobileToVerify);
      if (res.success && res.isCardHolder) {
        setIsCardHolder(true);
        setCustomerName(res.cardholderData.name);
        setCardId(res.cardholderData.cardId);
        setDiscountPercent(res.cardholderData.discountPercent);
        toast.success("CardHolder Verified! Discount Applied.");
      } else {
        setIsCardHolder(false);
        setCustomerName("");
        setCardId(null);
        setDiscountPercent(0);
        toast("Regular Customer. No discount applied.", { icon: "ℹ️" });
      }
    } catch (error) {
      toast.error("Failed to verify mobile number");
    } finally {
      setSearching(false);
    }
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    const product = products.find((p) => p._id === selectedProduct);
    if (!product) return;

    if (selectedQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const existingItem = items.find((item) => item.product === selectedProduct);
    const currentlyInCart = existingItem ? existingItem.quantity : 0;
    const totalRequested = currentlyInCart + selectedQuantity;

    if (totalRequested > product.stock) {
      if (currentlyInCart > 0) {
        toast.error(`Only ${product.stock} items in stock! You already have ${currentlyInCart} in bill.`);
      } else {
        toast.error(`Only ${product.stock} items in stock!`);
      }
      return;
    }

    if (existingItem) {
      setItems(items.map((item) => 
        item.product === selectedProduct 
          ? { ...item, quantity: item.quantity + selectedQuantity, total: (item.quantity + selectedQuantity) * item.price }
          : item
      ));
    } else {
      setItems([...items, {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: selectedQuantity,
        total: product.price * selectedQuantity
      }]);
    }
    setSelectedProduct("");
    setProductSearchTerm("");
    setSelectedQuantity(1);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) && p.status === "Active"
  );

  const removeItem = (productId) => {
    setItems(items.filter((item) => item.product !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) return;
    
    const product = products.find(p => p._id === productId);
    if (product && qty > product.stock) {
      toast.error(`Only ${product.stock} items in stock!`);
      return;
    }

    setItems(items.map((item) => 
      item.product === productId 
        ? { ...item, quantity: qty, total: qty * item.price }
        : item
    ));
  };

  const subTotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subTotal * discountPercent) / 100;
  const finalAmount = subTotal - discountAmount;

  const handleSave = async () => {
    if (!mobile || !customerName) {
      toast.error("Please provide customer mobile and name");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item to the bill");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerMobile: mobile,
        customerName,
        isCardHolder,
        cardId,
        items,
        subTotal,
        discountPercent,
        discountAmount,
        finalAmount,
        prescriptionId: prescription?._id
      };
      const res = await pharmacyBillsAPI.create(payload);
      if (res.success) {
        toast.success("Bill generated successfully!");
        setGeneratedBill(res.bill);
      } else {
        toast.error(res.error || "Failed to generate bill");
      }
    } catch (error) {
      toast.error("Failed to generate bill");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;
    setIsDownloading(true);
    const element = billRef.current;
    const opt = {
      margin: 10,
      filename: `Invoice_${generatedBill?._id || 'Preview'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      toast.error("Failed to download PDF");
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!billRef.current) return;
    
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.top = "-9999px";
    document.body.appendChild(printFrame);
    
    let styles = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      styles += el.outerHTML;
    });
    
    const content = billRef.current.innerHTML;
    const doc = printFrame.contentWindow.document;
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice - ${generatedBill?._id || 'Preview'}</title>
          ${styles}
        </head>
        <body class="bg-white">
          ${content}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
    
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 5000);
  };

  const BillPreview = () => (
    <div ref={billRef} className="p-8 bg-white text-black relative min-h-[500px] flex flex-col border-2 border-gray-200 shadow-sm mx-auto w-full max-w-4xl font-sans">
      
      {/* INVOICE BADGE */}
      <div className="absolute top-0 right-8 bg-green-700 text-white px-5 py-1.5 rounded-b-md shadow-sm text-[10px] font-black tracking-[0.3em] uppercase">
        Invoice
      </div>

      <div className="flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b-2 border-gray-800 gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-black uppercase tracking-wider text-green-700 leading-none mb-3">{shopName}</h1>
            {pharmacyDetails && (
              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider space-y-1.5 leading-relaxed">
                {pharmacyDetails.shopAddress && <p className="max-w-xs">{pharmacyDetails.shopAddress}</p>}
                <p>
                  {pharmacyDetails.userId?.phone ? `Ph: ${pharmacyDetails.userId.phone}` : ""} 
                  {pharmacyDetails.userId?.phone && pharmacyDetails.userId?.email ? " | " : ""}
                  {pharmacyDetails.userId?.email ? `Email: ${pharmacyDetails.userId.email}` : ""}
                </p>
                <p>
                  {pharmacyDetails.gstNumber ? `GST: ${pharmacyDetails.gstNumber}` : ""}
                  {pharmacyDetails.gstNumber && pharmacyDetails.licenseNumber ? " | " : ""}
                  {pharmacyDetails.licenseNumber ? `D.L. No: ${pharmacyDetails.licenseNumber}` : ""}
                </p>
              </div>
            )}
          </div>
          <div className="text-right pt-6 md:pt-0">
            {generatedBill ? (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm min-w-[160px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Invoice No</p>
                <p className="text-sm font-bold text-gray-900">{generatedBill._id.substring(generatedBill._id.length - 8).toUpperCase()}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-3 mb-1">Date</p>
                <p className="text-sm font-bold text-gray-900">{new Date(generatedBill.createdAt).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm min-w-[160px] text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Date</p>
                <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mt-3">DRAFT</p>
              </div>
            )}
          </div>
        </div>

        {/* Billed To Section */}
        <div className="mb-8 p-4 border border-gray-200 bg-gray-50 rounded-sm">
          <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest mb-2 border-b border-gray-200 pb-2">Billed To</h3>
          <p className="font-black text-gray-900 text-sm mt-2 uppercase">{customerName || "Customer Name"}</p>
          <p className="text-gray-600 text-xs font-bold mt-1">Ph: {mobile || "Mobile Number"}</p>
          {isCardHolder && (
            <p className="text-green-700 font-black text-[10px] tracking-wider mt-2 uppercase flex items-center gap-1">
              ✓ JSSA Cardholder
            </p>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300 text-left">
                <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 border-r border-gray-300">Description</th>
                <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 text-right border-r border-gray-300 w-24">Price</th>
                <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 text-center border-r border-gray-300 w-20">Qty</th>
                <th className={`p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 text-right w-28 ${!generatedBill ? 'border-r border-gray-300' : ''}`}>Amount</th>
                {!generatedBill && <th className="p-3 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length > 0 ? items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-900 font-bold border-r border-gray-300">{item.name}</td>
                  <td className="p-3 text-right text-gray-600 font-bold border-r border-gray-300">₹{item.price.toFixed(2)}</td>
                  <td className="p-3 text-center font-black text-gray-900 border-r border-gray-300">
                    {!generatedBill ? (
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product, e.target.value)}
                        className="w-16 p-1 text-center border border-gray-300 outline-none focus:border-[#3AB000] text-xs font-bold"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className={`p-3 text-right font-black text-gray-900 ${!generatedBill ? 'border-r border-gray-300' : ''}`}>₹{item.total.toFixed(2)}</td>
                  {!generatedBill && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeItem(item.product)}
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-sm transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={!generatedBill ? 5 : 4} className="p-8 text-center text-gray-400 font-bold text-xs tracking-wider uppercase">
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-12">
          <div className="w-72 border border-gray-300 bg-gray-50 rounded-sm p-4 shadow-sm">
            <div className="flex justify-between py-1.5 text-sm">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Subtotal:</span>
              <span className="font-black text-gray-900">₹{subTotal.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between py-1.5 text-green-600 text-sm">
                <span className="font-bold uppercase tracking-wider text-[10px]">Discount ({discountPercent}%):</span>
                <span className="font-black">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-4 border-t-2 border-gray-300 mt-2">
              <span className="font-black uppercase tracking-wider text-gray-900 text-xs mt-1">Grand Total:</span>
              <span className="font-black text-2xl text-green-700">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Footer */}
      <div className="mt-8 pt-4 pb-4 text-center border-t border-gray-300 bg-gray-50 -mx-8 -mb-8">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Powered by JSSA Platform</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="pharmacy">
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate("/pharmacy/dashboard/bills")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#3AB000] transition-colors font-black uppercase text-xs tracking-wider"
            >
              <ArrowLeft size={16} />
              Back to Bills
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Side */}
            <div className="space-y-6">
              {/* Customer Section */}
              <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                <div className="bg-[#3AB000] p-4 flex items-center gap-2">
                  <User size={16} className="text-white" />
                  <h2 className="text-white font-black uppercase tracking-wider text-xs">
                    Customer Details
                  </h2>
                </div>
                <div className="p-6 space-y-5 bg-white">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength="10"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        disabled={generatedBill !== null || searching}
                        placeholder="Enter 10-digit mobile"
                        className="w-full px-4 pr-10 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400 disabled:opacity-50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {searching ? (
                          <Loader2 size={16} className="text-[#3AB000] animate-spin" />
                        ) : isCardHolder ? (
                          <svg className="text-[#3AB000] w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isCardHolder || generatedBill !== null}
                      placeholder="Enter customer name"
                      className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400 disabled:opacity-50"
                    />
                    {isCardHolder && (
                      <p className="text-[9px] text-[#3AB000] font-black tracking-wider mt-1.5 uppercase">Name auto-filled from JSSA Card.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Section */}
              {!generatedBill && (
                <div className="bg-white rounded-none border border-gray-200 overflow-visible">
                  <div className="bg-[#3AB000] p-4 flex items-center gap-2">
                    <Plus size={16} className="text-white" />
                    <h2 className="text-white font-black uppercase tracking-wider text-xs">
                      Add Items
                    </h2>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="flex flex-col sm:flex-row gap-3 items-end relative">
                      <div className="flex-1 w-full relative" ref={dropdownRef}>
                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Search & Select Product</label>
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => {
                            setProductSearchTerm(e.target.value);
                            setIsDropdownOpen(true);
                            if (selectedProduct) setSelectedProduct("");
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          placeholder="Type medicine name..."
                          className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all"
                        />
                        
                        {isDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map(p => (
                                <div
                                  key={p._id}
                                  onClick={() => {
                                    if (p.stock <= 0) {
                                      toast.error("This product is out of stock!");
                                      return;
                                    }
                                    setSelectedProduct(p._id);
                                    setProductSearchTerm(`${p.name} - ₹${p.price.toFixed(2)}`);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2 text-xs font-bold border-b border-gray-100 last:border-0 cursor-pointer flex justify-between items-center transition-colors
                                    ${p.stock <= 0 ? 'bg-red-50 text-red-400 opacity-60 cursor-not-allowed' : 'hover:bg-[#f9fff5] hover:text-[#3AB000] text-gray-700'}`}
                                >
                                  <div>
                                    <p className="uppercase">{p.name}</p>
                                    <p className="text-[9px] text-gray-400 mt-0.5 uppercase">₹{p.price.toFixed(2)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-[10px] font-black tracking-widest ${p.stock > 0 ? 'text-[#3AB000]' : 'text-red-500'}`}>
                                      {p.stock > 0 ? `STOCK: ${p.stock}` : 'OUT OF STOCK'}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-4 text-xs font-bold text-gray-400 text-center uppercase tracking-wider">
                                No medicines found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-24">
                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                          className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all text-center"
                        />
                      </div>
                      <button
                        onClick={addItem}
                        className="bg-[#3AB000] hover:bg-[#2d8a00] text-white px-5 h-10 font-black uppercase tracking-wider transition-all flex items-center justify-center rounded-none"
                      >
                        <span className="text-[10px]">ADD</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview & Action Side */}
            <div className="space-y-6">
              <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
                <div className="bg-[#3AB000] p-4 flex justify-between items-center">
                  <h2 className="text-white font-black uppercase flex items-center gap-2 text-xs tracking-wider">
                    <FileText size={16} /> Bill Preview
                  </h2>
                  {generatedBill ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-white text-[#3AB000] px-4 h-8 rounded-none text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 transition-colors"
                      >
                        <Printer size={12} /> Print
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="flex items-center gap-2 bg-white text-[#3AB000] px-4 h-8 rounded-none text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} 
                        {isDownloading ? "DOWNLOADING..." : "DOWNLOAD PDF"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={saving || items.length === 0 || !mobile || !customerName}
                      className="flex items-center gap-2 bg-white text-[#3AB000] px-4 h-8 rounded-none text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "SAVING..." : <><Save size={12} /> GENERATE BILL</>}
                    </button>
                  )}
                </div>
                <div className="p-4 bg-gray-50 min-h-[400px] overflow-y-auto">
                  <div className="bg-white shadow-sm border border-gray-200 relative">
                    {/* We render the preview that will be used for PDF generation */}
                    <BillPreview />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePharmacyBill;
