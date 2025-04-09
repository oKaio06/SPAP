'use client'

import { useState } from 'react';

export default function AdminPanel({ adminKey }) {
  const [deleteUserName, setDeleteUserName] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  // Handler para deletar um usuário
  const handleDeleteUser = async (event) => {
    setShowPopup(false);
    event.preventDefault();
    try {
      const response = await fetch('/api/delete-user', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: deleteUserName, key: adminKey })
      });
      const data = await response.json();
      
      // Defina a mensagem do popup com base na resposta do back-end
      setPopupMessage(data.message || 'Usuário deletado com sucesso!');
      setShowPopup(true);
      // Limpe o campo de input se desejar
      setDeleteUserName('');
    } catch (error) {
      setPopupMessage('Erro ao deletar usuário.');
      setShowPopup(true);
    }
  };

  // Handler para listar os usuários
  const handleListUsers = async () => {
    setShowPopup(false);
    try {
      const response = await fetch('/api/list-users', {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      setPopupMessage(`Usuários: ${data.users.toString()}`);
      setShowPopup(true);
    } catch (error) {
      console.log(error);
      setPopupMessage('Erro ao listar usuários.');
      setShowPopup(true);
    }
  };

  // Fecha o popup
  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  return (
    <div className="admin-panel flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Menu Administrativo</h2>
      
      {/* Formulário para deletar um usuário */}
      <form onSubmit={handleDeleteUser} className="delete-user-form mb-4">
        <label htmlFor="deleteUserName" className="block mb-2">
          Nome do usuário para deletar:
        </label>
        <input 
          type="text"
          id="deleteUserName"
          value={deleteUserName}
          onChange={(e) => setDeleteUserName(e.target.value)}
          required
          className="border p-2 mb-2 rounded"
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Deletar Usuário
        </button>
      </form>

      <button 
        onClick={handleListUsers}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Mostrar Nomes dos Usuários
      </button>

      {showPopup && (
          <div className="fixed bottom-0 left-0 w-full bg-[#171717] border-t border-gray-700 rounded-t-lg shadow-md p-6 animate-slide-up">
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
    </div>
  );
}
