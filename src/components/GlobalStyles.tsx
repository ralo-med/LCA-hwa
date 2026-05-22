const GlobalStyles = () => (
  <style>{`
    @media print {
      .no-print { display: none !important; }
      .print-full {
        width: 100% !important; max-width: 100% !important;
        margin: 0 !important; padding: 0 !important;
        box-shadow: none !important; border: none !important;
      }
      body { background-color: white !important; color: black !important; font-size: 13pt !important; }
      .card {
        border: 1px solid #cbd5e1 !important; border-radius: 8px !important;
        padding: 15px !important; margin-bottom: 20px !important; box-shadow: none !important;
      }
      .prose { color: black !important; max-width: 100% !important; font-size: 12pt !important; line-height: 1.7 !important; }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `}</style>
);

export default GlobalStyles;
