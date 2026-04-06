import { config, fields, collection } from '@keystatic/core';

const TAG_OPTIONS = [
  { label: '驚悚', value: '驚悚' },
  { label: '推理', value: '推理' },
  { label: '科幻', value: '科幻' },
  { label: '幽默', value: '幽默' },
  { label: '諷刺', value: '諷刺' },
  { label: '愛情', value: '愛情' },
  { label: '青春', value: '青春' },
  { label: '職場', value: '職場' },
  { label: '環保', value: '環保' },
  { label: '政治', value: '政治' },
  { label: '財經', value: '財經' },
  { label: '社會', value: '社會' },
  { label: '科技', value: '科技' },
  { label: '文化', value: '文化' },
  { label: '散文', value: '散文' },
  { label: '成長', value: '成長' },
  { label: '親情', value: '親情' },
  { label: '台北', value: '台北' },
  { label: '美食', value: '美食' },
  { label: '健康', value: '健康' },
];

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
          kind: 'github',
          // REQUIRED Vercel env vars: GITHUB_REPO_OWNER, GITHUB_REPO_NAME,
          // KEYSTATIC_GITHUB_CLIENT_ID, KEYSTATIC_GITHUB_CLIENT_SECRET, KEYSTATIC_SECRET
          repo: `${process.env.GITHUB_REPO_OWNER ?? 'costin10-ten'}/${process.env.GITHUB_REPO_NAME ?? 'MRTnovels'}` as `${string}/${string}`,
          branchPrefix: 'keystatic/',
        }
      : { kind: 'local' },

  ui: {
    brand: { name: '狂小說後台' },
    navigation: {
      '文章管理': ['stories'],
    },
  },

  collections: {
    stories: collection({
      label: '文章管理',
      slugField: 'title',
      path: 'src/content/stories/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: '標題' } }),

        publishDate: fields.date({
          label: '發布日期',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),

        author: fields.text({
          label: '作者',
          defaultValue: '站長',
          validation: { isRequired: true },
        }),

        tags: fields.multiselect({
          label: '分類標籤',
          options: TAG_OPTIONS,
        }),

        access: fields.select({
          label: '機密等級',
          options: [
            { label: '公開（不需登入）', value: 'public' },
            { label: '會員（免費加入）', value: 'member' },
            { label: '付費（付費會員）', value: 'paid' },
          ],
          defaultValue: 'public',
        }),

        summary: fields.text({
          label: '摘要',
          multiline: true,
          validation: { isRequired: true },
        }),

        cover: fields.image({
          label: '封面圖',
          directory: 'public/covers',
          publicPath: '/covers/',
        }),

        content: fields.markdoc({
          label: '文章內容',
          extension: 'md',
        }),

        iceberg: fields.text({
          label: '冰山之下（會員解鎖）',
          multiline: true,
        }),

        characters: fields.text({
          label: '出場人物資料（會員解鎖）',
          multiline: true,
        }),
      },
    }),
  },
});
