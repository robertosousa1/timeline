const json2md = require("json2md");
const moment = require('moment-timezone')
moment.tz.setDefault('America/Sao_Paulo')
moment.locale('pt')
const { readFileSync, writeFileSync } = require("fs");

const VIDEO_COUNT_TAG = "$$count_demo";
const TOTAL_PRESENTATIONS_TAG = "$$count_total";
const POST_COUNT_TAG = "$$count_blog";
const TALK_COUNT_TAG = "$$count_talk";
const PROJECT_COUNT_TAG = "$$count_project";

const BLOG_CONTENT_TAG = "$$blog-content$$";
const TALK_CONTENT_TAG = "$$talk-content$$";
const VIDEO_CONTENT_TAG = "$$video-content$$";
const PROJECT_CONTENT_TAG = "$$project-content$$";
const REPOSITORY = "https://github.com/robertosousa1/timeline";

const TIMELINE_DEMO_TAG = "$$timeline_demo$$";
const TIMELINE_TALK_TAG = "$$timeline_talk$$";
const TIMELINE_BLOG_TAG = "$$timeline_blog$$";
const TIMELINE_PROJECT_TAG = "$$timeline_project$$";

function sortByDate(prev, next) {
  const prevDate = new Date(prev.date);
  const nextDate = new Date(next.date);

  if (prevDate < nextDate) return 1;
  if (prevDate > nextDate) return -1;
  return 0;
}

function getFile(path) {
  return JSON.parse(readFileSync(path));
}

function mapPostMarkdown(item) {
  return [
    {
      h3: convertLink(
        item.link,
        `${item.title} (${item.language})`
      )
    },
    {
      h4: `Data: ${item.date}`
    },
    {
      p: `Portal:`
    },
    {
      blockquote: convertLink(item.portal.link, item.portal.name)
    },
    {
      p: "Resumo:"
    },
    {
      blockquote: item.abstract
    },
    {
      p: `_Tags: ${item.tags}_`
    }
  ];
}

function mapLatLong(location) {
  return `${location.city} - ${location.uf}, ${location.country}`;
}

function mapTalkMarkdown(item) {
  const contentSession = mapContentLinks(item);

  return [
    {
      h3: `${item.title} (${item.language})`
    },
    {
      h4: `Data: ${item.date}`
    },
    {
      p: convertLink(item.event.link, item.event.name)
    },
    {
      p: contentSession
    },
    {
      p: "Resumo:"
    },
    {
      blockquote: item.abstract
    },
    {
      p: `_Tags: ${item.tags}_`
    },
    {
      p: `Localização: ${mapLatLong(item.location)}.`
    }
  ];

  function mapExternalLinks(link) {
    const githubContentLink = `${REPOSITORY}/tree/master/`;
    if (~link.indexOf("http")) return link;

    return `${githubContentLink}${link}`;
  }

  function mapContentLinks(item) {
    const slidesText = item.slides
      ? `${convertLink(item.slides, "slides")}`
      : "";
    const videoText = `${
      item.video ? `${convertLink(mapExternalLinks(item.video), "video")}` : ``
    }`;
    const photoText = `${
      item.photos
        ? `${convertLink(mapExternalLinks(item.photos), "photos")}`
        : ``
    }`;
    const slidesSection =
      (photoText || videoText) && slidesText ? slidesText.concat(" | ") : "";
    const photosSection =
      videoText && photoText ? photoText.concat(" | ") : photoText;
    const contentSession = `${slidesSection} ${photosSection} ${videoText}`;
    return contentSession;
  }
}

function mapVideoMarkdown(item) {
  return [
    {
      h3: convertLink(
        item.link,
        `${item.title} (${item.language})`
      )
    },
    {
      h4: `Data: ${item.date}`
    },
    {
      p: "Resumo:"
    },
    {
      blockquote: item.abstract
    },
    {
      p: `_Tags: ${item.tags}_`
    }
  ];
}

function mapProjectMarkdown(item) {
  return [
    {
      h3: convertLink(
        item.link,
        `${item.title} (${item.language})`
      )
    },
    {
      h4: `Data: ${item.date}`
    },
    {
      p: "Resumo:"
    },
    {
      blockquote: item.abstract
    },
    {
      p: `_Tags: ${item.tags}_`
    }
  ];
}

function convertLink(link, text) {
  return `<a href="${link}" target="_blank">${text}</a>`;
}

function mapTags(item) {
  item.tags = item.tags.map(i => `\`${i}\``).join(", ");
  return item;
}
function mapAdditionalLinks(item) {
  const links = item.additionalLinks
    .filter(i => !!i)
    .map(i => `- ${convertLink(i, i)}\n`)
    .join("");
  const textLink = links ? `<b>Links</b>\n\n${links}` : "";
  item.abstract = `${item.abstract}\n\n${textLink}`;
  return item;
}
function getMinMaxDate(items) {
  const dates = items.map(i => moment(i.date, "DD-MM-YYYY"));
  const min = moment.min(dates).format("MMMM/YYYY");
  const max = moment.max(dates).format("MMMM/YYYY");
  return `${max} - ${min} `;
}

function mapMarkdown(items, fn) {
  return items
    .sort(sortByDate)
    .map(item => fn(mapAdditionalLinks(mapTags(item))))
    .reduce((prev, next) => prev.concat(next), []);
}

function normalizeCount(arr) {
  const length = arr.length;
  if (length < 10) return `0${length}`;
  return `${length}`;
}

(() => {
  const data = readFileSync(
    "resources/templates/template.md",
    "utf8"
  ).toString();

  const talks = getFile("resources/talks.json");
  const talksMd = mapMarkdown(talks, mapTalkMarkdown);
  const maxMinDateTalk = getMinMaxDate(talks);

  const posts = getFile("resources/posts.json");
  const postMd = mapMarkdown(posts, mapPostMarkdown);
  const maxMinDatePost = getMinMaxDate(posts);

  const videos = getFile("resources/videos.json");
  const videosMd = mapMarkdown(videos, mapVideoMarkdown);
  const maxMinDateVideos = getMinMaxDate(videos);

  const projects = getFile("resources/projects.json");
  const projectsMd = mapMarkdown(projects, mapProjectMarkdown);
  const maxMinDateProjects = getMinMaxDate(projects);

  const [countTalks, countPosts, countVideos, countProjects] = [
    talks,
    posts,
    videos,
    projects
  ].map(normalizeCount);

  const totalPresentations = parseInt(countTalks) + parseInt(countVideos) + parseInt(countProjects);
  const content = data
    .replace(TALK_CONTENT_TAG, json2md(talksMd))
    .replace(TALK_COUNT_TAG, countTalks)
    .replace(TIMELINE_TALK_TAG, maxMinDateTalk)

    .replace(BLOG_CONTENT_TAG, json2md(postMd))
    .replace(POST_COUNT_TAG, countPosts)
    .replace(TIMELINE_BLOG_TAG, maxMinDatePost)

    .replace(VIDEO_CONTENT_TAG, json2md(videosMd))
    .replace(VIDEO_COUNT_TAG, countVideos)
    .replace(TIMELINE_DEMO_TAG, maxMinDateVideos)

    .replace(PROJECT_CONTENT_TAG, json2md(projectsMd))
    .replace(PROJECT_COUNT_TAG, countProjects)
    .replace(TIMELINE_PROJECT_TAG, maxMinDateProjects)

    .replace(TOTAL_PRESENTATIONS_TAG, totalPresentations);

  writeFileSync("README.md", content);
  console.log(`Total Presentations: ${totalPresentations}`);
  console.log(
    `Talks: ${countTalks}, Posts: ${countPosts}, Videos: ${countVideos}, Projects: ${countProjects}`
  );
  console.log("readme generated with success!");
})();
