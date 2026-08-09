import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../features/auth/authService.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await registerUser(formData);

      navigate("/login");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

 return (
   <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
     <div className="w-full max-w-md">
       <div className="mb-8 text-center">
         <h1 className="text-3xl font-bold text-slate-900">FlowBoard</h1>

         <p className="mt-2 text-sm text-slate-500">
           Create your account and start organizing work.
         </p>
       </div>

       <Card>
         <div className="mb-6">
           <h2 className="text-xl font-semibold text-slate-900">
             Create account
           </h2>

           <p className="mt-1 text-sm text-slate-500">
             Enter your details to get started.
           </p>
         </div>

         {error && (
           <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
             {error}
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="mb-1.5 block text-sm font-medium text-slate-700">
               Name
             </label>

             <input
               id="name"
               name="name"
               type="text"
               value={formData.name}
               onChange={handleChange}
               placeholder="Your name"
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
             />
           </div>

           <div>
             <label className="mb-1.5 block text-sm font-medium text-slate-700">
               Email
             </label>

             <input
               id="email"
               name="email"
               type="email"
               value={formData.email}
               onChange={handleChange}
               placeholder="you@example.com"
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
             />
           </div>

           <div>
             <label className="mb-1.5 block text-sm font-medium text-slate-700">
               Password
             </label>

             <input
               id="password"
               name="password"
               type="password"
               value={formData.password}
               onChange={handleChange}
               placeholder="Create a strong password"
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
             />
           </div>

           <Button type="submit" disabled={loading} className="w-full">
             {loading ? "Creating account..." : "Create Account"}
           </Button>
         </form>

         <p className="mt-6 text-center text-sm text-slate-500">
           Already have an account?{" "}
           <Link
             to="/login"
             className="font-medium text-indigo-600 hover:text-indigo-700"
           >
             Sign in
           </Link>
         </p>
       </Card>
     </div>
   </div>
 );
};

export default RegisterPage;
