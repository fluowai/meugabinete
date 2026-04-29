import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, Eye, Edit2, Trash2, Copy, ExternalLink, X, 
  ChevronLeft, ChevronRight, Filter, BarChart3, EyeOff, Eye as EyeIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { LandingPage } from '../types';
import { useLandingPages } from '../hooks/useApi';

export default function LandingPageList() {
  const { data: pages, loading, total, page, totalPages, pageSize, refresh, create, update, remove } = useLandingPages(1, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta landing page?')) {
      await remove(id);
    }
  };

  const openPreview = (page: LandingPage) => {
    setSelectedPage(page);
    setShowPreview(true);
  };

  const toggleStatus = async (p: LandingPage) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    await update(p.id, { status: newStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar landing pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto h-10 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Todos os status</option>
            <option value="published">Publicadas</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" />
          Nova Landing Page
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Vistas</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Conv.</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Atualização</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Nenhuma landing page encontrada</p>
                      <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Criar primeira landing page
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pages.map((page) => {
                  const conversionRate = page.views > 0 ? (page.submissions / page.views) * 100 : 0;
                  return (
                    <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{page.name}</span>
                          <span className="text-[10px] text-gray-400 md:hidden">/{page.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(page)}
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-medium transition-colors",
                            page.status === 'published' 
                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          )}
                        >
                          {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className="text-sm text-gray-900 font-medium">{page.views.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className="text-sm text-gray-900 font-medium">{page.submissions.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "text-sm font-medium",
                          conversionRate > 5 ? "text-green-600" : conversionRate > 2 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {new Date(page.updatedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPreview(page)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Duplicar">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {pages.length} de {total} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showPreview && selectedPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
              <div>
                <h2 className="text-lg font-semibold">{selectedPage.name}</h2>
                <p className="text-sm text-gray-500">/{selectedPage.slug}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Título de Confirmação</h3>
                <p className="text-lg text-blue-800">{selectedPage.confirmationTitle}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Descrição</h3>
                <div dangerouslySetInnerHTML={{ __html: selectedPage.description }} className="prose prose-sm" />
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">LGPD</h3>
                <p className="text-sm text-gray-700">{selectedPage.lgpdText}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Botão</h3>
                  <button
                    style={{ backgroundColor: selectedPage.confirmationButtonColor }}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                  >
                    {selectedPage.confirmationButtonText}
                  </button>
                </div>
                {selectedPage.showShareButton && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Botão Compartilhar</h3>
                    <button
                      style={{ backgroundColor: selectedPage.shareButtonColor }}
                      className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                    >
                      {selectedPage.shareButtonText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}