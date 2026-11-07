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
    
    // Sort commits by total lines in descending order
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

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



    // function to handle brush events
    function brushed(event) {
        const selection = event.selection;

        d3.selectAll('circle').classed('selected', (d) =>
            isCommitSelected(selection, d),
        );

        renderSelectionCount(selection);
    }


    // function to check if a commit is within the selected area
    function isCommitSelected(selection, commit) {
    if (!selection) {
        return false;
    }

    const [x0, y0] = selection[0];
    const [x1, y1] = selection[1];

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }   

    
    // function to create brush selector
    function createBrushSelector(svg) {
    // Create brush
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
}


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
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    
    // add gridlines to the plot
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(
        d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.width)
            );

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
    
    // define a scale for the radius of the circles based on the number of lines in each commit
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    // add circles to represent commits
    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1);

    renderTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);

        updateTooltipVisibility(false);
    });
    
    // add brush selector to the plot
    createBrushSelector(svg);



    // function to render the count of selected commits
    function renderSelectionCount(selection) {
        const selectedCommits = selection
            ? commits.filter((d) => isCommitSelected(selection, d))
            : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
    }
}


// function to render tooltip content
    function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;

    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });

    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

    // function to update tooltip visibility
    function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

    // function to update tooltip position
    function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');

    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}







let data = await loadData();
let commits = processCommits(data);
// render commit information
renderCommitInfo(data, commits);
// render scatter plot of commits
renderScatterPlot(data, commits);
