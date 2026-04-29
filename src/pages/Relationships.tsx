import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Users, Heart, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Relationship, Citizen } from '../types';
import * as mockApi from '../hooks/mockApi';

const relationshipTypes = [
  { value: 'family', label: 'Família', color: 'bg-purple-100 text-purple-800' },
  { value: 'friend', label: 'Amigo', color: 'bg-pink-100 text-pink-800' },
  { value: 'colleague', label: 'Colega', color: 'bg-blue-100 text-blue-800' },
  { value: 'neighbor', label: 'Vizinho', color: 'bg-green-100 text-green-800' },
  { value: 'political', label: 'Político', color: 'bg-red-100 text-red-800' },
  { value: 'business', label: 'Negócio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Outro', color: 'bg-gray-100 text-gray-800' },
];

const strengthConfig = {
  weak: { label: 'Fraca', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  strong: { label: 'Forte', color: 'bg-green-100 text-green-800' },
};

export default function Relationships() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    type: 'family' as Relationship['type'],
    citizenId: '',
    relatedToId: '',
    strength: 'medium' as Relationship['strength'],
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rels, cits] = await Promise.all([
        Promise.resolve(mockApi.mockData.relationships),
        Promise.resolve(mockApi.mockData.citizens),
      ]);
      setRelationships(rels);
      setCitizens(cits);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRelationships = relationships.filter((rel) => {
    const matchesSearch = !search || 
      rel.relatedToName.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || rel.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getCitizenName = (id: string) => {
    const citizen = citizens.find(c => c.id === id);
    return citizen?.name || 'Unknown';
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este relacionamento?')) {
      const index = mockApi.mockData.relationships.findIndex(r => r.id === id);
      if (index >= 0) {
        mockApi.mockData.relationships.splice(index, 1);
        await loadData();
      }
    }
  };

  const openDetails = (rel: Relationship) => {
    setSelectedRelationship(rel);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (rel: Relationship) => {
    setSelectedRelationship(rel);
    setFormData({
      type: rel.type,
      citizenId: rel.citizenId,
      relatedToId: rel.relatedToId,
      strength: rel.strength,
      notes: rel.notes || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setSelectedRelationship(null);
    setFormData({
      type: 'family',
      citizenId: citizens[0]?.id || '',
      relatedToId: citizens[1]?.id || '',
      strength: 'medium',
      notes: '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRelationship(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedRelationship) {
      const newRel: Relationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: formData.type,
        citizenId: formData.citizenId,
        relatedToId: formData.relatedToId,
        relatedToName: getCitizenName(formData.relatedToId),
        strength: formData.strength,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockApi.mockData.relationships.push(newRel);
    } else {
      const index = mockApi.mockData.relationships.findIndex(r => r.id === selectedRelationship.id);
      if (index >= 0) {
        mockApi.mockData.relationships[index] = {
          ...mockApi.mockData.relationships[index],
          ...formData,
          relatedToName: getCitizenName(formData.relatedToId),
          updatedAt: new Date().toISOString(),
        };
      }
    }
    await loadData();
    closeModal();
  };

  if (loading && !relationships.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar relacionamentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todos os tipos</option>
            {relationshipTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Relacionamento
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cidadão</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Relacionado com</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Força</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notas</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredRelationships.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500">Nenhum relacionamento encontrado</p>
                    <p className="text-sm text-gray-400">Tente ajustar sua busca ou filtro</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRelationships.map((rel) => (
                <tr key={rel.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', relationshipTypes.find(t => t.value === rel.type)?.color || 'bg-gray-100 text-gray-600')}>
                      {relationshipTypes.find(t => t.value === rel.type)?.label || rel.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900">{getCitizenName(rel.citizenId)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">{rel.relatedToName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', strengthConfig[rel.strength]?.color || 'bg-gray-100 text-gray-600')}>
                      {strengthConfig[rel.strength]?.label || rel.strength}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500 max-w-xs truncate block">{rel.notes || '-'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetails(rel)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(rel)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rel.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {loading && relationships.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? (selectedRelationship ? 'Editar Relacionamento' : 'Novo Relacionamento') : 'Detalhes do Relacionamento'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {isEditing ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Relationship['type'] })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {relationshipTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidadão</label>
                      <select
                        value={formData.citizenId}
                        onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {citizens.map((citizen) => (
                          <option key={citizen.id} value={citizen.id}>
                            {citizen.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relacionado com</label>
                      <select
                        value={formData.relatedToId}
                        onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {citizens.map((citizen) => (
                          <option key={citizen.id} value={citizen.id}>
                            {citizen.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Força</label>
                      <select
                        value={formData.strength}
                        onChange={(e) => setFormData({ ...formData, strength: e.target.value as Relationship['strength'] })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="weak">Fraca</option>
                        <option value="medium">Média</option>
                        <option value="strong">Forte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        placeholder="Observações sobre o relacionamento..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              ) : selectedRelationship ? (
                <>
                  <div className="text-center pb-4 border-b border-gray-100">
                    <div className="flex justify-center mb-3">
                      <Heart className="w-12 h-12 text-red-400" />
                    </div>
                    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', relationshipTypes.find(t => t.value === selectedRelationship.type)?.color || 'bg-gray-100 text-gray-600')}>
                      {relationshipTypes.find(t => t.value === selectedRelationship.type)?.label || selectedRelationship.type}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Cidadão</span>
                      <span className="text-gray-900 font-medium">{getCitizenName(selectedRelationship.citizenId)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Relacionado com</span>
                      <span className="text-gray-900 font-medium">{selectedRelationship.relatedToName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Força</span>
                      <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium w-fit', strengthConfig[selectedRelationship.strength]?.color || 'bg-gray-100 text-gray-600')}>
                        {strengthConfig[selectedRelationship.strength]?.label || selectedRelationship.strength}
                      </span>
                    </div>
                    {selectedRelationship.notes && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Notas</span>
                        <span className="text-gray-900">{selectedRelationship.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => { setIsEditing(true); setFormData({ type: selectedRelationship.type, citizenId: selectedRelationship.citizenId, relatedToId: selectedRelationship.relatedToId, strength: selectedRelationship.strength, notes: selectedRelationship.notes || '' }); }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}