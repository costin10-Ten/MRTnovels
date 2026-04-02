import { config, fields, collection } from '@keystatic/core';

const TAG_OPTIONS = [
  { label: '驚悚', value: 'thriller' },
  { label: '政治', value: 'politics' },
  { label: '環保', value: 'eco' },
  { label: '推理', value: 'mystery' },
  { label: '科幻', value: 'scifi' },
  { label: '青春', value: 'youth' },
  { label: '感情', value: 'romance' },
  { label: '職業', value: 'career' },
];

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
          kind: 'github',
          repo: `${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}` as `${string}/${string}`,
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

        content: fields.document({
          label: '文章內容',
          formatting: true,
          dividers: true,
          links: true,
        }),
      },
    }),
  },
});
