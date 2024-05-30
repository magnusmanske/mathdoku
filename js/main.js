'use strict';

let router ;
let app ;

var sudokuGenerator = {
	generateCells: function(size,difficulty) {
		let cells = [];
		let solution = this.generateSudoku(size);
    	for (let row = 0; row < size; row++) {
    		for (let col = 0; col < size; col++) {
    			let cell = {
    				solution: solution[row][col],
    				num: cells.length,
    				row: row,
    				col: col,
    				selected: false,
    				section_id: -1,
    				section_text: '', // 1260×
    				value: 0,
    				possible: this.get_possible_empty(),
    				border: {top:false, left:false},
    			};
    			cells.push(cell);
    		}
    	}
    	this.updateCellsWithRegions(solution,cells,difficulty);
    	return cells;
	},
    updateCellsWithRegions: function(solution,cells,difficulty) {
    	let size = solution.length;
    	let max = 5;
    	if (size<7) max=4;
    	if (size<5) max=3;
		let regions = this.generateRegions(solution,max,difficulty);
    	for(let region of regions) {
    		let top_cell = 9999; // Unreachably high
    		for (let cell of region.cells) {
    			let row = cell[0];
    			let col = cell[1];
    			let cell_num = row*size+col;
    			cells[cell_num].section_id = region.id;
    			if ( cell_num<top_cell ) top_cell = cell_num;
    		}
    		cells[top_cell].section_text = region.text;
    	}
    	for(let cell of cells) {
    		let above = cell.num-size;
    		let left = cell.num-1;
    		if (cell.row>0 && cells[above].section_id!=cell.section_id) cell.border.top=true;
    		if (cell.col>0 && cells[left].section_id!=cell.section_id) cell.border.left=true;
    	}
    },

	generateRegions: function(board,max_region_size,difficulty) {
		if ( difficulty+1<max_region_size && difficulty<5 ) {
			max_region_size = difficulty+1;
		}
		let regions = [];
		let size = board.length;
		let sections = Array.from({ length: size }, () => Array.from({ length: size }, () => -1));
		while ( true ) {
			let region = {id:regions.length+1, cells:[], text:''};
			// Find first cell for region
			for(let row=0; row<size; row++) {
				for(let col=0; col<size; col++) {
					if ( sections[row][col]>=0 ) continue;
					region.cells.push([row,col]);
					sections[row][col] = region.id;
					break;
				}
				if (region.cells.length>0) break;
			}
			if (region.cells.length==0) break; // No cell without region left

			// Grow region
			let attempts = 0;
			while ( region.cells.length<max_region_size ) {
				// Pick a random cell from the ones we have
				this.shuffleArray(region.cells);
				let row = region.cells[0][0];
				let col = region.cells[0][1];
				let candidates = [];
				if ( row>0 && sections[row-1][col]<0 ) candidates.push([row-1,col]);
				if ( row+1<size && sections[row+1][col]<0 ) candidates.push([row+1,col]);
				if ( col>0 && sections[row][col-1]<0 ) candidates.push([row,col-1]);
				if ( col+1<size && sections[row][col+1]<0 ) candidates.push([row,col+1]);
				if ( candidates.length==0 ) { // No candidates
					attempts++ ;
					if ( attempts>20 ) break; // Prevent forever loop
					continue;
				}

				// Found at least one candidate
				attempts = 0;
				this.shuffleArray(candidates);
				row = candidates[0][0];
				col = candidates[0][1];
				sections[row][col] = region.id;
				region.cells.push([row,col]);

				// random break
				if ( Math.random()>0.9 ) break;
			}
			regions.push(region);
		}

		for(let region of regions) {
			let candidate_texts = [];
			if (region.cells.length==1) {
				candidate_texts.push(''+this.getCellValue(board,region.cells[0]));
			}
			if (region.cells.length==2) {
				let v1 = this.getCellValue(board,region.cells[0]);
				let v2 = this.getCellValue(board,region.cells[1]);
				if (v1%v2==0) candidate_texts.push(''+(v1/v2)+'/');
				if (v2%v1==0) candidate_texts.push(''+(v2/v1)+'/');
				candidate_texts.push(''+Math.abs(v1-v2)+'-');
			}
			if (region.cells.length>=2) {
				let sum = 0;
				let product = 1;
				for (let cell of region.cells) {
					sum += this.getCellValue(board,cell);
					product *= this.getCellValue(board,cell);
				}
				candidate_texts.push(''+sum+'+');
				candidate_texts.push(''+product+'×');
			}

			this.shuffleArray(candidate_texts);
			region.text = candidate_texts[0];
		}

		return regions;
	},
	getCellValue(cells,row_col) {
		let row = row_col[0];
		let col = row_col[1];
		return cells[row][col];
	},
	generateSudoku: function(size) {
		let again = true ;
		let board = [];
		while ( again ) {
			again = false;
			board = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

			for ( let value = 1 ; value <= size ; value++ ) {
				let used_columns = [];
				for ( let row = 0; row < size ; row++ ) {
					let available_columns = [];
					for ( let col = 0 ; col < size ; col++ ) {
						if ( board[row][col] > 0 ) continue ;
						if ( used_columns.indexOf(col) >= 0 ) continue;
						available_columns.push(col);
					}
					this.shuffleArray(available_columns);
					if ( available_columns.length==0) {
						again = true;
						break;
					}
					let col = available_columns[0];
					used_columns.push(col);
					board[row][col] = value;
				}
				if ( again ) break ;
			}
		}

		return board;
	} ,
	get_possible_empty() {
		let ret = [];
		for(let i=1; i<=9; i++) {
			ret[i] = false;
		}
		return ret;
	},
	shuffleArray: function(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

};


$(document).ready ( function () {
    Promise.all ( [
        vue_components.loadComponents ( [
            'js/main-page.html',
            'js/game-page.html',
            'js/new-page.html',
            'js/cell.html',
            'js/board.html',
            ] )
    ] )
    .then ( () => {
		const routes = [
			{ path: '/', component: MainPage , props:true },
			{ path: '/game/:size', component: GamePage , props:true },
			{ path: '/new', component: NewPage , props:true },
			{ path: '/new/:default_size', component: NewPage , props:true },
		] ;
		router = new VueRouter({routes}) ;
		app = new Vue ( { router } ) .$mount('#app') ;
	});
});