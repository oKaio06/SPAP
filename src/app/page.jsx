'use client'

import Image from "next/image";
import { useState } from "react"

export default function Home() {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const formHandler = async (event) => {
    event.preventDefault();
    setShowPopup(false);

    try {
      const acao = event.nativeEvent.submitter.value;
      let apiFetch;
      if (acao === "criar_user") {
        setPopupMessage(`🎉 Parabéns, você criou seu usuário ${nome}!!!`);
        apiFetch = "/api/create-user";

      } else if (acao === "checar_amigo") {
        setPopupMessage(`🤔 Seu amigo secreto é o "${result.secretFriend}"! shhh`);
        apiFetch = "/api/check-secret-friend";
      }

      const response = await fetch(apiFetch, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: nome, password: senha })
      });
      const result = await response.json();
      
      console.log(!result);

      if (!response.ok || !result) {
        setPopupMessage(`❌ Erro: ${result.error}`);
      }

      setShowPopup(true);
    } catch (e) {
      console.error(e.message);
      setPopupMessage(`💀 fodeu: ${e}`);
      setShowPopup(true);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8 font-[family-name:var(--font-geist-sans)] text-center">

      <main className="flex flex-col items-center gap-8 w-full max-w-4xl flex-1 justify-center">

        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-8">
            <Image
                src="/images/sorteadormasterblaster.png"
                alt="ih deu pau"
                width={1150}
                height={415}
                priority
            />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          Insira seu nome e uma senha
        </h2>

        <div className="bg-white/10 p-6 rounded-lg shadow-md max-w-md mx-auto">

          <form onSubmit={formHandler} className="space-y-4">
            <div>
              <input
                className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-300 mb-5 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                id="nomeInput"
                type="text"
                placeholder="Digite seu Nome"
                required
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                id="senhaInput"
                type="password"
                placeholder="Digite uma senha"
                required
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div>
              <button 
              type="submit"
              value="criar_user" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 mb-5 mr-5 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800" >
                Criar Usuario
              </button>
              <button
              type="submit"
              value="checar_amigo"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"> 
                Checar Amigo Secreto
              </button>
            </div>
          </form>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <h2>made with luv by kaio :]</h2>
        {showPopup && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-700 rounded-t-lg shadow-md p-6 animate-slide-up">
            <div className="flex justify-end">
              <button onClick={closePopup} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-4 text-center">
              <span className="text-xl font-semibold text-gray-300">{popupMessage}</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
