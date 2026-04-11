export default function QuestionFilters({
  subjects,
  topics,
  subjectId,
  topic,
  difficulty,
  questionType,
  search,
  viewMode,
  onSubjectChange,
  onTopicChange,
  onDifficultyChange,
  onQuestionTypeChange,
  onSearchChange,
  onViewModeChange,
  loadingTopics,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Search</label>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search question text…"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          />
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:self-end sm:pb-2">
            View
          </span>
          <div className="flex rounded-xl border border-neutral-200 p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-deep-blue text-white' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                viewMode === 'list' ? 'bg-deep-blue text-white' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Topic</label>
          <select
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            disabled={!subjectId || loadingTopics}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25 disabled:opacity-50"
          >
            <option value="">{subjectId ? 'All topics' : 'Select a subject'}</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          >
            <option value="">Any</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Question type</label>
          <select
            value={questionType}
            onChange={(e) => onQuestionTypeChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          >
            <option value="">Any</option>
            <option value="multiple_choice">Multiple choice</option>
            <option value="short_answer">Short answer</option>
          </select>
        </div>
      </div>
    </div>
  );
}
