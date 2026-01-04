import { useState } from "react";
import "./App.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import Card from "./components/Card";


const API_URL = "YOUR_API_GATEWAY_URL_HERE";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];


function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sampleResponse = [
    {
      "month": "October Expenses",
      "currency": "INR",
      "summary": {
        "totalDays": 2,
        "totalSpent": 2770.0,
        "averagePerDay": 1385.0,
        "totalExpense": 2270.0,
        "totalInvestment": 500.0
      },
      "highestExpense": {
        "amount": 1200.0,
        "date": "02/10/25",
        "category": "Rent"
      },
      "topCategories": {
        "Rent": 1200.0,
        "Food": 620.0,
        "Travel": 450.0
      }
    }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setText(reader.result);
    reader.readAsText(file);
  };

  const analyzeExpenses = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // const response = await fetch(API_URL, {
      //   method: "POST",
      //   headers: { "Content-Type": "text/plain" },
      //   body: text,
      // });

      // const data = await response.json();
      setResult(sampleResponse);
    } catch (err) {
      setError("Failed to analyze expenses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>OutGo – Money Flow Insights</h1>

      <textarea
        placeholder="Paste expense data here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {result && result.map((month, index) => (
        <div key={index} className="month-block">

          <h2>{month.month}</h2>

          {/* SUMMARY CARDS */}
          <div className="cards">
            <Card label="Total Spent" value={`${month.currency} ${month.summary.totalSpent}`} />
            <Card label="Avg / Day" value={`${month.currency} ${month.summary.averagePerDay}`} />
            <Card label="Expenses" value={`${month.currency} ${month.summary.totalExpense}`} />
            <Card label="Investment" value={`${month.currency} ${month.summary.totalInvestment}`} />
          </div>

          {/* HIGHEST EXPENSE */}
          <div className="highlight">
            Highest Expense: {month.currency} {month.highestExpense.amount} on{" "}
            {month.highestExpense.date} ({month.highestExpense.category})
          </div>

          {/* PIE CHART */}
          <div className="chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(month.topCategories).map(([k, v]) => ({
                    name: k,
                    value: v
                  }))}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label
                >
                  {Object.keys(month.topCategories).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      ))}


      <div className="controls">
        <input type="file" accept=".txt" onChange={handleFileUpload} />
        <button onClick={analyzeExpenses} disabled={!text || loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <pre className="result">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;