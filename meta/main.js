import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// function to load data from CSV file
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}


// function to process commit data
function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;

            let ret = {
                id: commit,
                url: 'https://github.com/QSiming/DSC106-lab/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false,
            });

            return ret;
        });
}

// function to render commit information
function renderCommitInfo(data, commits) {
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // group data by file and count the number of unique files
    dl.append('dt').text('Number of files');
    dl.append('dd').text(d3.group(data, (d) => d.file).size);

    dl.append('dt').text('Average line length');
    dl.append('dd').text(d3.mean(data, (d) => d.length).toFixed(2));

    dl.append('dt').text('Maximum depth');
    dl.append('dd').text(d3.max(data, (d) => d.depth));

    dl.append('dt').text('Average depth');
    dl.append('dd').text(d3.mean(data, (d) => d.depth).toFixed(2));
}


// function to render scatter plot of commits
function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    const yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    // define margins for the plot area
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
        };

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    // add labels to the axes
    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 5)
        .attr('fill', 'steelblue');
}



let data = await loadData();
let commits = processCommits(data);
// render commit information
renderCommitInfo(data, commits);
// render scatter plot of commits
renderScatterPlot(data, commits);
