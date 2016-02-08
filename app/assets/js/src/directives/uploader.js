teechioDashboard.directive('fileUploader', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attr) {
			scope._queue = [];
			scope._queueSize = 0;
			scope._uprogress = false;

			var opts = {
				runtimes : 'html5',
				browse_button : attr.id,
				multipart: false,
				drop_element: 'drop-area',
				max_file_size : '64mb',
				url: '/console/upload',
				headers: {
					'Teech-REST-API-key': scope.dashboard.apikey,
					'Teech-Application-Id': scope.dashboard.appid
				}
			}
			var uploader = new plupload.Uploader(opts);

			uploader.bind('Init', function(up, params) {});
			
			uploader.init();
			
			uploader.bind('FilesAdded', function(up, files) {
				angular.forEach(files, function(file) {
					var file_copy = {
						id: file.id,
						name: file.name,
						size: plupload.formatSize(file.size),
						synced: 'not-synced'
					};
					scope.$apply(function() {
						scope._queue.push(file);
						scope._queueSize += 1;
						if(scope.files)
							scope.files.unshift(file_copy);	
					});
				});
			});
			
			uploader.bind('BeforeUpload', function(uploader, file) {});
			
			uploader.bind('UploadProgress', function(up, file) {
				scope.$apply(function() {
					scope._uprogress = true;
				});
				$('span.percentage', '#uploader-progress').html(file.percent);
			});
			
			uploader.bind('FileUploaded', function(up, file, res) {
				if(res) {
					$('#upload-modal').modal('hide');
					$('span.percentage', '#uploader-progress').html(0);
					scope.$apply(function() {
						scope.files.shift(); // removes the file in queue and now fully uploaded
						scope.files.unshift(JSON.parse(res.response));
						scope._queue = [];
						scope._queueSize = 0;
						scope._uprogress = false;
					})
				}
				up.refresh();
			});
			
			uploader.bind('Error', function(up, err) {
				$('.notification', '#uploader-progress').addClass('error').html(err.message).slideDown('fast');				
				up.refresh()
			});

			scope.startUpload = function() {
				uploader.start()
			}
			
			scope.removeFile = function(index, file) {
				uploader.removeFile(file.gfile)
				scope.files.splice(index, 1)
			}

			$('#upload-modal').on('hidden.bs.modal', function () 
			{
				$('span.percentage', '#uploader-progress').html(0);
				$('.notification', '#uploader-progress').hide();
				scope.$apply(function() {
					scope._queue = [];
					scope._queueSize = 0;
					scope._uprogress = false;
				})
			});
		}
	}
});