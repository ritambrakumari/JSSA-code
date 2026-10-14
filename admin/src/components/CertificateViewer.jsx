import React from 'react';

const CertificateViewer = ({ templateId, mode = 'preview', employeeData = {}, customData = {}, issueDate = new Date(), certId = 'XXXXXX' }) => {
    // Helper components for blanks vs dynamic data
    const NameField = () => mode === 'preview' ? (
        <span className="inline-block border-b border-black w-64"></span>
    ) : (
        <span className="inline-block border-b border-black min-w-[200px] px-2 text-center text-[#3F6212] font-bold">{employeeData?.name || ''}</span>
    );

    const DesignationField = ({ width = 'w-64' }) => mode === 'preview' ? (
        <span className={`inline-block border-b border-black ${width}`}></span>
    ) : (
        <span className="inline-block border-b border-black min-w-[150px] px-2 text-center text-[#3F6212] font-bold">{employeeData?.designation || employeeData?.role || ''}</span>
    );

    const LocationField = ({ width = 'w-64' }) => mode === 'preview' ? (
        <span className={`inline-block border-b border-black ${width}`}></span>
    ) : (
        <span className="inline-block border-b border-black min-w-[200px] px-2 text-center text-[#3F6212] font-bold">
            {employeeData?.district || employeeData?.workingDistrict || ''} / {employeeData?.state || employeeData?.workingState || ''}
        </span>
    );

    const StateField = ({ width = 'w-64' }) => mode === 'preview' ? (
        <span className={`inline-block border-b border-black ${width}`}></span>
    ) : (
        <span className="inline-block border-b border-black min-w-[150px] px-2 text-center text-[#3F6212] font-bold">{employeeData?.state || employeeData?.workingState || ''}</span>
    );

    const TrainingNameField = () => mode === 'preview' ? (
        <span className="inline-block border-b border-black w-[400px]"></span>
    ) : (
        <span className="inline-block border-b border-black min-w-[200px] px-2 text-center text-[#3F6212] font-bold">Organizational Development Training</span>
    );

    const YearVal = mode === 'preview' ? '20___' : new Date(issueDate).getFullYear();
    const YearBlank = mode === 'preview' ? '________' : new Date(issueDate).getFullYear();
    const DateVal = mode === 'preview' ? '____/____/_______' : new Date(issueDate).toLocaleDateString();
    const PlaceVal = mode === 'preview' ? '________________' : <span className="inline-block border-b border-black min-w-[150px] px-2 text-center text-[#3F6212] font-bold">Delhi (HQ)</span>;
    const CertSuffix = mode === 'preview' ? '____' : certId.substring(certId.length - 6).toUpperCase();

    // 1. Training Certificate
    if (templateId === 'training') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">उत्कृष्ट योगदान प्रशंसा प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Certificate of Appreciation for Outstanding Contribution)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/COA/{YearVal} / {CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रशंसा प्रमाण-पत्र श्री/श्रीमती <NameField /> को <strong>"संगठनात्मक विकास प्रशिक्षण कार्यक्रम"</strong> के सफल आयोजन, सक्रिय सहभागिता, उत्कृष्ट सहयोग एवं महत्वपूर्ण योगदान के लिए प्रदान किया जाता है।
                    आपके समर्पण, नेतृत्व, सहयोग एवं संगठन के उद्देश्यों के प्रति प्रतिबद्धता ने प्रशिक्षण कार्यक्रम की सफलता में महत्वपूर्ण भूमिका निभाई है। आपके द्वारा प्रदान किए गए मूल्यवान योगदान एवं प्रेरणादायी कार्यों की सराहना करते हुए जन आरोग्य सहायता अभियान (JSSA) आपको यह <strong>"उत्कृष्ट योगदान प्रशंसा प्रमाण-पत्र"</strong> प्रदान करता है।
                    <div className="text-center font-bold mt-4">हम आपके उज्ज्वल भविष्य एवं निरंतर सफलता की कामना करते हैं।</div>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2 leading-loose">
                        <div>प्रशिक्षण कार्यक्रम: <TrainingNameField /></div>
                        <div>दिनांक: {DateVal}</div>
                        <div>स्थान: {PlaceVal}</div>
                    </div>
                    <div className="flex gap-16 shrink-0">
                        <div className="text-center"><div>प्रशिक्षण प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Leadership Excellence
    if (templateId === 'rm-zc-dm') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">नेतृत्व उत्कृष्टता प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Leadership Excellence Certificate)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/LEC/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद / Designation: <DesignationField /> जिला / क्षेत्र / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के अंतर्गत उत्कृष्ट नेतृत्व क्षमता, प्रभावी टीम प्रबंधन, संगठनात्मक विकास, सदस्य मार्गदर्शन एवं जनसेवा गतिविधियों के सफल संचालन में उल्लेखनीय योगदान प्रदान किया है।
                    आपके दूरदर्शी नेतृत्व, समर्पण, कार्यकुशलता एवं संगठन के उद्देश्यों के प्रति प्रतिबद्धता ने टीम को प्रेरित करने तथा संगठन को नई ऊँचाइयों तक पहुँचाने में महत्वपूर्ण भूमिका निभाई है।
                    आपके उत्कृष्ट नेतृत्व एवं संगठन निर्माण में विशेष योगदान के सम्मानस्वरूप आपको यह <strong>"नेतृत्व उत्कृष्टता प्रमाण-पत्र (Leadership Excellence Certificate)"</strong> प्रदान किया जाता है।
                    "टीम नेतृत्व, संगठनात्मक विकास, प्रभावी समन्वय एवं प्रेरणादायी कार्यशैली के माध्यम से उत्कृष्ट योगदान हेतु यह नेतृत्व उत्कृष्टता प्रमाण-पत्र सादर प्रदान किया जाता है।"
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">दिनांक / Date: {DateVal}</div>
                        <div>स्थान / Place: {PlaceVal}</div>
                    </div>
                    <div className="flex gap-16 shrink-0">
                        <div className="text-center"><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>राष्ट्रीय प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Social Impact
    if (templateId === 'rm-zc-dm-social-impact') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">सामाजिक प्रभाव प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Social Impact Certificate)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/SIC/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-2 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद / Designation: <DesignationField /> जिला / क्षेत्र / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के माध्यम से स्वास्थ्य जागरूकता, जनकल्याण, सामुदायिक विकास, सामाजिक सहयोग एवं स्वास्थ्य सेवाओं की पहुँच बढ़ाने के क्षेत्र में उल्लेखनीय एवं प्रेरणादायक योगदान प्रदान किया है।
                    आपके नेतृत्व, समर्पण, सक्रिय सहभागिता एवं सामाजिक उत्तरदायित्व की भावना ने समाज में सकारात्मक परिवर्तन लाने तथा जरूरतमंद लोगों तक स्वास्थ्य सहायता एवं जागरूकता पहुँचाने में महत्वपूर्ण भूमिका निभाई है।
                    समाज पर आपके उत्कृष्ट प्रभाव एवं जनहित में किए गए सराहनीय कार्यों के सम्मानस्वरूप आपको यह <strong>"सामाजिक प्रभाव प्रमाण-पत्र (Social Impact Certificate)"</strong> प्रदान किया जाता है।
                </div>
                <div className="text-left font-bold text-[0.85rem] mb-0 mt-0">
                    <div>विशेष उपलब्धियां</div>
                    <ul className="list-disc pl-8 font-normal leading-normal mt-1">
                        <li>स्वास्थ्य जागरूकता अभियान संचालन</li>
                        <li>हेल्थ कार्ड पंजीकरण एवं लाभार्थी सहायता</li>
                        <li>रक्तदान एवं स्वास्थ्य शिविर आयोजन</li>
                        <li>सामुदायिक सहभागिता एवं जनसंपर्क</li>
                        <li>संगठन विस्तार एवं सामाजिक सहयोग</li>
                    </ul>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">दिनांक / Date: {DateVal}</div>
                        <div>स्थान / Place: {PlaceVal}</div>
                    </div>
                    <div className="flex gap-20 shrink-0">
                        <div className="text-center"><div>क्षेत्रीय प्रभारी (RM)</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Appreciation
    if (templateId === 'rm-zc-dm-appreciation') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h2 className="text-xl font-bold mb-1 mt-4 text-[#3F6212]">जन आरोग्य सहायता अभियान (JSSA) प्रशंसा प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Certificate of Appreciation)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/COA/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद / Designation: <DesignationField /> जिला / क्षेत्र / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के उद्देश्यों की पूर्ति, संगठन के विस्तार, सदस्यता संवर्धन, स्वास्थ्य जागरूकता गतिविधियों एवं प्रशासनिक सहयोग में उल्लेखनीय योगदान प्रदान किया है।
                    संगठन के प्रति आपकी निष्ठा, समर्पण, सहयोग एवं सक्रिय सहभागिता की सराहना करते हुए आपको यह <strong>"प्रशंसा प्रमाण-पत्र (Certificate of Appreciation)"</strong> प्रदान किया जाता है।
                    आपके योगदान ने संगठन को सुदृढ़ बनाने तथा जनहित एवं स्वास्थ्य सहायता सेवाओं को अधिक प्रभावी ढंग से समाज तक पहुँचाने में महत्वपूर्ण भूमिका निभाई है।
                    <strong>जन आरोग्य सहायता अभियान आपके उज्ज्वल भविष्य, उत्तम स्वास्थ्य एवं निरंतर प्रगति की कामना करता है।</strong>
                </div>
                <div className="flex justify-between items-end mt-auto pt-4 px-2 font-bold text-base w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">दिनांक / Date: {DateVal}</div>
                        <div>स्थान / Place: {PlaceVal}</div>
                    </div>
                    <div className="flex gap-20 shrink-0">
                        <div className="text-center"><div>जिला प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Employee Excellence
    if (templateId === 'employee') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">उत्कृष्टता प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Certificate of Excellence)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/COE/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद / Designation: <DesignationField /> जिला / क्षेत्र / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के उद्देश्यों की पूर्ति, संगठनात्मक विकास, जनसेवा, नेतृत्व क्षमता एवं उत्कृष्ट कार्य निष्पादन में असाधारण योगदान प्रदान किया है।
                    वर्ष {YearBlank} के दौरान आपके द्वारा प्रदर्शित उत्कृष्ट कार्य, समर्पण, अनुशासन, कार्यकुशलता एवं संगठन के प्रति विशेष योगदान के आधार पर आपको <strong>"Certificate of Excellence (उत्कृष्टता प्रमाण-पत्र)"</strong> प्रदान किया जाता है।
                    यह सम्मान JSSA के अंतर्गत सभी पदों एवं श्रेणियों में से चयनित वर्ष के सर्वश्रेष्ठ प्रदर्शनकर्ता <strong>(Company Top Performer)</strong> को प्रदान किया जाता है।
                    <strong>आपकी उपलब्धि संगठन के लिए गौरव का विषय है तथा अन्य सदस्यों के लिए प्रेरणास्रोत है।</strong>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">वर्ष / Year: {YearBlank}</div>
                        <div className="mb-2">दिनांक / Date: {DateVal}</div>
                        <div>स्थान / Place: {PlaceVal}</div>
                    </div>
                    <div className="flex gap-16 shrink-0">
                        <div className="text-center"><div>महासचिव</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>राष्ट्रीय प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 6. Employee Outstanding
    if (templateId === 'employee-outstanding') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">उत्कृष्ट कार्य निष्पादन प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Certificate of Outstanding Performance)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/COP/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद: <DesignationField /> जिला / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के अंतर्गत निर्धारित लक्ष्यों एवं दायित्वों का सफलतापूर्वक निर्वहन करते हुए लक्ष्य की प्राप्ति एवं संगठनात्मक विकास में उत्कृष्ट योगदान दिया है।
                    आपके समर्पण, परिश्रम, कार्यकुशलता एवं निर्धारित लक्ष्य को सफलतापूर्वक प्राप्त करने/उससे बेहतर प्रदर्शन करने के लिए आपको यह <strong>"उत्कृष्ट कार्य निष्पादन प्रमाण-पत्र (Certificate of Outstanding Performance)"</strong> प्रदान किया जाता है।
                    आपकी उपलब्धि संगठन के अन्य सदस्यों के लिए प्रेरणास्रोत है तथा जनसेवा के प्रति आपकी प्रतिबद्धता अत्यंत सराहनीय है।
                    <div className="text-center font-bold mt-4">हम आपके उज्ज्वल भविष्य एवं निरंतर सफलता की कामना करते हैं।</div>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">दिनांक (Date): {DateVal}</div>
                        <div>स्थान (Place): {PlaceVal}</div>
                    </div>
                    <div className="flex gap-16 shrink-0">
                        <div className="text-center"><div>जिला प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 7. Employee Performance
    if (templateId === 'employee-performance') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h2 className="text-xl font-bold mb-2 mt-4 text-[#3F6212]">जन आरोग्य सहायता अभियान (JSSA) कार्य निष्पादन प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Certificate of Performance)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/COP/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद / Designation: <DesignationField /> जिला / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के अंतर्गत निर्धारित कार्यों एवं लक्ष्यों की प्राप्ति हेतु सक्रिय रूप से कार्य किया तथा निर्धारित लक्ष्य का {mode === 'preview' ? '_________' : <span className="inline-block border-b border-black min-w-[50px] px-2 text-center text-[#3F6212] font-bold">{employeeData?.achievementPercentage ?? customData?.achievementPercentage ?? 100}</span>}% सफलतापूर्वक प्राप्त किया।
                    आपके प्रयास, सहभागिता एवं संगठन के प्रति समर्पण की सराहना करते हुए आपको यह कार्य निष्पादन प्रमाण-पत्र (Certificate of Performance) प्रदान किया जाता है।
                    <div className="text-center font-bold mt-4">हम आपके उज्ज्वल भविष्य एवं निरंतर प्रगति की कामना करते हैं।</div>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="flex justify-start mb-2">
                        <table className="border-collapse border border-black w-96 text-left text-sm bg-white">
                            <tbody>
                                <tr><td className="border border-black p-2 font-bold">लक्ष्य / Target</td><td className="border border-black p-2">{mode === 'preview' ? '' : ((employeeData?.targetCount ?? customData?.targetCount) ? `${employeeData?.targetCount ?? customData?.targetCount} Cards` : 'Completed')}</td></tr>
                                <tr><td className="border border-black p-2 font-bold">उपलब्धि / Achievement</td><td className="border border-black p-2">{mode === 'preview' ? '' : ((employeeData?.cardsCount ?? customData?.cardsCount) !== undefined ? `${employeeData?.cardsCount ?? customData?.cardsCount} Cards` : '100%')}</td></tr>
                                <tr><td className="border border-black p-2 font-bold">प्राप्त प्रतिशत / Achieved %</td><td className="border border-black p-2">{mode === 'preview' ? '' : `${employeeData?.achievementPercentage ?? customData?.achievementPercentage ?? 100}%`}</td></tr>
                                <tr><td className="border border-black p-2 font-bold">दिनांक / Date</td><td className="border border-black p-2">{mode === 'preview' ? '' : DateVal}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-20 shrink-0 mb-4">
                        <div className="text-center"><div>(हस्ताक्षर)</div><div>जिला प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>(हस्ताक्षर)</div><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 8. Employee Best State
    if (templateId === 'employee-best-state') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">राज्य स्तरीय उत्कृष्ट प्रदर्शन प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">(Best State Performer Certificate)</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / JSSA/BSPC/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> पद / Designation: <DesignationField width="w-[400px]" /> जिला / राज्य: <LocationField /> ने जन आरोग्य सहायता अभियान (JSSA) के अंतर्गत उत्कृष्ट कार्य निष्पादन, सक्रिय सहभागिता एवं संगठनात्मक विकास में महत्वपूर्ण योगदान दिया है।
                    विशेष रूप से, आपके द्वारा राज्य स्तर पर सर्वाधिक सदस्यता/हेल्थ कार्ड पंजीकरण एवं जनसंपर्क कार्यों में उल्लेखनीय उपलब्धि प्राप्त करने के लिए आपको <strong>"Best State Performer Certificate (राज्य स्तरीय उत्कृष्ट प्रदर्शन प्रमाण-पत्र)"</strong> प्रदान किया जाता है।
                    <strong>आपकी निष्ठा, समर्पण एवं उत्कृष्ट कार्यशैली संगठन के अन्य सदस्यों के लिए प्रेरणास्रोत है।</strong>
                    <strong>जन आरोग्य सहायता अभियान आपके उज्ज्वल भविष्य एवं निरंतर सफलता की कामना करता है।</strong>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">वर्ष / Year: {YearBlank}</div>
                        <div className="mb-2">राज्य / State: <StateField /></div>
                        <div>दिनांक / Date: {DateVal}</div>
                    </div>
                    <div className="flex gap-16 shrink-0">
                        <div className="text-center"><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>महासचिव</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>अध्यक्ष</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // 9. Employee Honor
    if (templateId === 'employee-honor') {
        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h2 className="text-xl font-bold mb-2 mt-4 text-[#3F6212]">जन आरोग्य सहायता अभियान (JSSA) सम्मान एवं प्रशंसा प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 tracking-widest uppercase">Certificate of Honor and Appreciation</h3>
                <div className="text-left font-bold mb-4 text-[1.1rem]">
                    प्रमाण-पत्र संख्या: JSSA/COHA/{YearVal}/{CertSuffix}
                </div>
                <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                    यह सम्मान एवं प्रशंसा प्रमाण-पत्र श्री/श्रीमती <NameField /> पद / कार्यालय / संस्था: <DesignationField /> को जन आरोग्य सहायता अभियान (JSSA) के उद्देश्यों की पूर्ति, जनकल्याण, स्वास्थ्य जागरूकता, सामाजिक सेवा एवं सामुदायिक विकास के क्षेत्र में उनके अमूल्य सहयोग, मार्गदर्शन, संरक्षण एवं उल्लेखनीय योगदान के लिए सम्मानपूर्वक प्रदान किया जाता है।
                    आपके नेतृत्व, सहयोग एवं जनहित के प्रति समर्पण ने समाज के विभिन्न वर्गों तक स्वास्थ्य सेवाओं एवं जागरूकता कार्यक्रमों को पहुँचाने में महत्वपूर्ण भूमिका निभाई है। आपके इस योगदान के प्रति कृतज्ञता व्यक्त करते हुए यह <strong>"सम्मान एवं प्रशंसा प्रमाण-पत्र"</strong> प्रदान किया जाता है।
                    <div className="text-center font-bold mt-4">हम आपके उज्ज्वल भविष्य, उत्तम स्वास्थ्य एवं निरंतर जनसेवा की कामना करते हैं।</div>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2">
                        <div className="mb-2">दिनांक / Date: {DateVal}</div>
                        <div>स्थान / Place: {PlaceVal}</div>
                    </div>
                    <div className="flex gap-20 shrink-0">
                        <div className="text-center"><div>(हस्ताक्षर)</div><div>जिला प्रभारी</div><div className="mt-8">JSSA</div></div>
                        <div className="text-center"><div>(हस्ताक्षर)</div><div>राज्य प्रभारी</div><div className="mt-8">JSSA</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // Custom Dynamic Certificate
    if (templateId === 'custom-dynamic') {
        const {
            recipientName = '________________',
            position = '________________',
            eventName = '________________________________',
            location = '________________',
            submittedBy = '________________',
            organizationName = 'जन आरोग्य सहायता अभियान (JSSA)',
            customContent = ''
        } = customData || {};

        const parseCustomContent = (text) => {
            if (!text) return null;
            const regex = /(\[Name\]|\[Position\]|\[Event\]|\[Location\])/gi;
            const parts = text.split(regex);
            
            return parts.map((part, i) => {
                const lowerPart = part.toLowerCase();
                if (lowerPart === '[name]') {
                    return <span key={i} className="inline-block border-b border-black min-w-[200px] px-2 text-center text-[#3F6212] font-bold mx-2">{recipientName}</span>;
                } else if (lowerPart === '[position]') {
                    return <span key={i} className="inline-block border-b border-black min-w-[250px] px-2 text-center text-[#3F6212] font-bold mx-2">{position}</span>;
                } else if (lowerPart === '[event]') {
                    return <span key={i} className="inline-block border-b border-black min-w-[250px] px-2 text-center text-[#3F6212] font-bold mx-2">{eventName}</span>;
                } else if (lowerPart === '[location]') {
                    return <span key={i} className="inline-block border-b border-black min-w-[150px] px-2 text-center text-[#3F6212] font-bold mx-2">{location}</span>;
                }
                return part;
            });
        };

        return (
            <div className="grow flex flex-col text-center leading-relaxed">
                <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">{organizationName}</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">प्रशंसा एवं भागीदारी प्रमाण-पत्र</h2>
                <h3 className="text-lg font-semibold text-gray-600 mb-10 tracking-widest uppercase">(Certificate of Participation and Appreciation)</h3>
                
                <div className="text-left font-bold mb-6 text-[1.1rem]">
                    प्रमाण-पत्र संख्या / {certId}
                </div>
                
                {customContent && customContent.trim() !== '' ? (
                    <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium whitespace-pre-wrap">
                        {parseCustomContent(customContent)}
                    </div>
                ) : (
                    <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                        यह सम्मान एवं प्रशंसा प्रमाण-पत्र श्री/श्रीमती 
                        <span className="inline-block border-b border-black min-w-[200px] px-2 text-center text-[#3F6212] font-bold mx-2">
                            {recipientName}
                        </span> 
                        पद / कार्यालय / संस्था: 
                        <span className="inline-block border-b border-black min-w-[250px] px-2 text-center text-[#3F6212] font-bold mx-2">
                            {position}
                        </span> 
                        <br/>
                        को जन आरोग्य सहायता अभियान (JSSA) के उद्देश्यों की पूर्ति, जनकल्याण, स्वास्थ्य जागरूकता, सामाजिक सेवा एवं सामुदायिक विकास के क्षेत्र में उनके अमूल्य सहयोग, मार्गदर्शन, संरक्षण एवं उल्लेखनीय योगदान के लिए सम्मानपूर्वक प्रदान किया जाता है। आपके नेतृत्व, सहयोग एवं जनहित के प्रति समर्पण ने समाज के विभिन्न वर्गों तक स्वास्थ्य सेवाओं एवं जागरूकता कार्यक्रमों को पहुँचाने में महत्वपूर्ण भूमिका निभाई है। आपके इस योगदान के प्रति कृतज्ञता व्यक्त करते हुए यह <strong>"सम्मान एवं प्रशंसा प्रमाण-पत्र"</strong> प्रदान किया जाता है।
                        <div className="text-center font-bold mt-4 text-[#3F6212]">हम आपके उज्ज्वल भविष्य, उत्तम स्वास्थ्य एवं निरंतर जनसेवा की कामना करते हैं।</div>
                    </div>
                )}

                <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                    <div className="text-left mb-2 leading-loose">
                        <div>दिनांक / Date: {new Date(issueDate).toLocaleDateString()}</div>
                        <div>स्थान / Place: {location === '________________' ? '________________' : location}</div>
                    </div>
                    <div className="flex gap-16 shrink-0">
                        <div className="text-center">
                            <div>(हस्ताक्षर)</div>
                            <div className="mt-8 text-[#3F6212] font-black uppercase">{submittedBy}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback Generic Template
    return (
        <div className="grow flex flex-col text-center leading-relaxed">
            <h1 className="text-3xl font-extrabold text-[#3F6212] mb-2 tracking-wide">जन आरोग्य सहायता अभियान (JSSA)</h1>
            <h2 className="text-xl font-bold text-gray-800 mb-1">प्रमाण-पत्र (Certificate)</h2>
            <div className="text-left font-bold mb-4 text-[1.1rem] mt-6">
                प्रमाण-पत्र संख्या / JSSA/CERT/{YearVal} / {CertSuffix}
            </div>
            <div className="text-center text-[1.1rem] leading-[2] mb-6 text-gray-800 font-medium">
                यह प्रमाणित किया जाता है कि श्री/श्रीमती <NameField /> को उनके उत्कृष्ट कार्य और संगठन के प्रति समर्पण के लिए यह प्रमाण-पत्र प्रदान किया जाता है।
            </div>
            <div className="flex justify-between items-end mt-auto pt-2 pb-6 px-2 font-bold text-[0.95rem] w-full">
                <div className="text-left mb-2 leading-loose">
                    <div>दिनांक: {DateVal}</div>
                    <div>स्थान: {PlaceVal}</div>
                </div>
                <div className="flex gap-16 shrink-0">
                    <div className="text-center"><div>अधिकृत हस्ताक्षरकर्ता</div><div className="mt-8">JSSA</div></div>
                </div>
            </div>
        </div>
    );
};

export default CertificateViewer;
